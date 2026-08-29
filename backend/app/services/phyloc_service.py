import re
import asyncio
import httpx
import dns.resolver
from datetime import datetime

SUSPICIOUS_TLDS = {
    'tk', 'ml', 'ga', 'cf', 'gq', 'xyz', 'top', 'club', 'online',
    'site', 'win', 'bid', 'loan', 'date', 'men', 'click', 'download',
    'review', 'stream', 'trade', 'webcam', 'science', 'party', 'racing',
    'gdn', 'work', 'host', 'wang', 'link', 'live'
}

ROLE_PREFIXES = [
    'admin', 'support', 'info', 'contact', 'sales', 'help', 'noreply',
    'no-reply', 'postmaster', 'webmaster', 'mailer-daemon', 'abuse',
    'security', 'billing', 'accounts', 'team', 'newsletter'
]

HIGH_RISK_PATTERNS = [
    re.compile(r'^(test|temp|tmp|mail|spam|junk|fake|trash|throw|nada)', re.IGNORECASE),
    re.compile(r'mailinator', re.IGNORECASE),
    re.compile(r'guerrilla', re.IGNORECASE),
    re.compile(r'sharklasers', re.IGNORECASE),
    re.compile(r'yopmail', re.IGNORECASE)
]

MAJOR_PROVIDERS = {
    'gmail.com', 'google.com', 'googlemail.com',
    'outlook.com', 'hotmail.com', 'live.com', 'msn.com', 'microsoft.com',
    'yahoo.com', 'ymail.com', 'aol.com',
    'icloud.com', 'me.com', 'mac.com', 'apple.com',
    'protonmail.com', 'proton.me', 'pm.me',
    'zoho.com', 'zohomail.com',
    'fastmail.com', 'tutanota.com', 'tuta.io',
    'hey.com', 'mail.com',
    'amazon.com', 'facebook.com', 'meta.com', 'twitter.com', 'x.com',
    'github.com', 'linkedin.com', 'salesforce.com', 'oracle.com',
    'ibm.com', 'adobe.com', 'cisco.com', 'intel.com', 'nvidia.com',
    'netflix.com', 'spotify.com', 'stripe.com', 'shopify.com'
}

def check_syntax(email: str):
    email_regex = re.compile(r'^[^\s@]+@[^\s@]+\.[^\s@]+$')
    if not email_regex.match(email):
        return {"valid": False, "error": "Invalid email format"}
    
    local, domain = email.split('@')
    if len(local) > 64:
        return {"valid": False, "error": "Local part too long (>64 chars)"}
    if len(domain) > 255:
        return {"valid": False, "error": "Domain too long (>255 chars)"}
    return {"valid": True, "local": local, "domain": domain.lower()}

def analyze_patterns(local: str, domain: str):
    findings = []
    
    if any(local.startswith(p) for p in ROLE_PREFIXES):
        findings.append("Role-based email account")
        
    tld = domain.split('.')[-1]
    if tld in SUSPICIOUS_TLDS:
        findings.append("Suspicious top-level domain")
        
    if any(p.search(local) or p.search(domain) for p in HIGH_RISK_PATTERNS):
        findings.append("Known high-risk pattern detected")
        
    digit_count = sum(c.isdigit() for c in local)
    if len(local) > 0 and (digit_count / len(local)) > 0.5 and len(local) > 6:
        findings.append("Numeric-heavy local part")
        
    if '..' in domain:
        findings.append("Consecutive dots in domain")
        
    if re.search(r'[^a-zA-Z0-9._-]', local):
        findings.append("Unusual characters in local part")
        
    return findings

async def analyze_dns(email: str):
    domain = email.split('@')[1]
    result = {"mx": {"hasMx": False, "mxRecords": []}, "dns": {"hasARecord": False, "hasAAAARecord": False}, "smtp": {"valid": False, "error": None}}
    try:
        resolver = dns.resolver.Resolver()
        resolver.timeout = 2
        resolver.lifetime = 2
        
        try:
            mx_answers = resolver.resolve(domain, 'MX')
            result["mx"]["hasMx"] = True
            for rdata in mx_answers:
                result["mx"]["mxRecords"].append({"exchange": str(rdata.exchange).rstrip('.'), "priority": rdata.preference})
        except Exception:
            pass
            
        try:
            a_answers = resolver.resolve(domain, 'A')
            result["dns"]["hasARecord"] = True
            result["dns"]["ipv4"] = [rdata.address for rdata in a_answers]
        except Exception:
            pass
            
    except Exception as e:
        result["error"] = str(e)
    return result

async def check_disposable(email: str):
    domain = email.split('@')[1]
    try:
        async with httpx.AsyncClient(timeout=3.0) as client:
            res = await client.get(f"https://open.kickbox.com/v1/disposable/{domain}")
            if res.status_code == 200:
                is_disposable = res.json().get("disposable", False)
                return {"isDisposable": is_disposable, "domain": domain, "source": "Kickbox Open API"}
    except Exception:
        pass
    
    # Fallback heuristic
    suspicious = domain.split('.')[-1] in SUSPICIOUS_TLDS
    return {"isDisposable": suspicious, "domain": domain, "source": "Heuristics"}

async def query_emailrep(email: str):
    try:
        async with httpx.AsyncClient(timeout=3.0) as client:
            res = await client.get(f"https://emailrep.io/{email}")
            if res.status_code == 200:
                data = res.json()
                return {"success": True, "data": data}
            return {"success": False, "error": f"Status {res.status_code}"}
    except Exception as e:
        return {"success": False, "error": str(e)}

def score_emailrep(raw):
    if not raw or not raw.get('success'):
        return {"score": 0, "signals": [], "error": raw.get('error', 'Unknown error')}
    
    data = raw.get('data', {})
    reputation = data.get('reputation', 'unknown')
    suspicious = data.get('suspicious', False)
    details = data.get('details', {})
    
    score = 50
    if reputation == 'high': score = 90
    if reputation == 'medium': score = 60
    if reputation == 'low': score = 20
    if reputation == 'none': score = 50
    
    signals = []
    if details.get('credentials_leaked'): signals.append('Credentials leaked')
    if details.get('malicious_activity'): signals.append('Malicious activity')
    if details.get('spam'): signals.append('Spam source')
    if details.get('data_breach'): signals.append('Data breach involvement')
    
    if suspicious:
        score -= 30
        
    return {"score": max(0, score), "signals": signals, "reputation": reputation, "suspicious": suspicious}

async def query_leakcheck(email: str):
    try:
        async with httpx.AsyncClient(timeout=3.0) as client:
            res = await client.get(f"https://leakcheck.io/api/public?check={email}")
            if res.status_code == 200:
                data = res.json()
                return {"success": True, "found": data.get("success", False), "sources": data.get("sources", [])}
            return {"success": False, "error": f"Status {res.status_code}"}
    except Exception as e:
        return {"success": False, "error": str(e)}

def score_leakcheck(data):
    if not data or not data.get('success'):
        return {"score": 0, "signals": [], "error": data.get('error', 'Unknown error')}
        
    found = data.get('found', False)
    sources = data.get('sources', [])
    if not found:
        return {"score": 0, "signals": [], "severity": "none"}
        
    score = min(100, len(sources) * 10)
    severity = 'high' if score > 50 else 'medium'
    return {"score": score, "signals": [f"Found in {len(sources)} breaches"], "severity": severity}

async def query_xposedornot(email: str):
    try:
        async with httpx.AsyncClient(timeout=3.0) as client:
            res = await client.get(f"https://api.xposedornot.com/v1/check-email/{email}")
            if res.status_code == 200:
                data = res.json()
                breaches = data.get("breaches", [[]])[0]
                formatted = [{"name": b, "domain": b} for b in breaches] if breaches else []
                return {"success": True, "found": bool(breaches), "breaches": formatted}
            elif res.status_code == 404:
                return {"success": True, "found": False, "breaches": []}
            return {"success": False, "error": f"Status {res.status_code}"}
    except Exception as e:
        return {"success": False, "error": str(e)}

async def query_pastes(email: str):
    try:
        async with httpx.AsyncClient(timeout=3.0) as client:
            res = await client.post("https://api.xposedornot.com/v1/pastes", json={"email": email})
            if res.status_code == 200:
                data = res.json()
                pastes = data.get("pastes", [])
                return {"success": True, "found": bool(pastes), "pastes": [{"source": "pastebin"} for p in pastes], "pasteCount": len(pastes)}
            return {"success": True, "found": False, "pastes": [], "pasteCount": 0}
    except Exception as e:
        return {"success": False, "error": str(e)}

def score_xposedornot(data):
    if not data or not data.get('success'):
        return {"score": 0, "signals": [], "error": data.get('error', 'Unknown error')}
        
    breaches = data.get('breaches', [])
    if not breaches:
        return {"score": 0, "signals": []}
        
    score = min(100, len(breaches) * 15)
    return {"score": score, "signals": [f"Found in {len(breaches)} XON breaches"]}

async def analyze_email_service(email: str):
    start_time = datetime.now()
    
    result = {
        "email": email,
        "timestamp": start_time.isoformat(),
        "syntax": None,
        "patterns": [],
        "dns": None,
        "disposable": None,
        "emailrep": None,
        "leakcheck": None,
        "xposedornot": None,
        "scores": {},
        "trustScore": 50,
        "riskLevel": "Unknown",
        "verdict": "Unknown",
        "signals": [],
        "details": [],
        "executionTimeMs": 0
    }
    
    syntax = check_syntax(email)
    result["syntax"] = syntax
    
    if not syntax["valid"]:
        result["trustScore"] = 0
        result["riskLevel"] = "High Risk"
        result["verdict"] = "High Risk"
        result["signals"].append("INVALID_SYNTAX")
        result["details"].append(syntax["error"])
        result["executionTimeMs"] = int((datetime.now() - start_time).total_seconds() * 1000)
        return result
        
    local = syntax["local"]
    domain = syntax["domain"]
    result["patterns"] = analyze_patterns(local, domain)
    
    tasks = [
        analyze_dns(email),
        check_disposable(email),
        query_emailrep(email),
        query_leakcheck(email),
        query_xposedornot(email),
        query_pastes(email)
    ]
    
    results = await asyncio.gather(*tasks, return_exceptions=True)
    
    result["dns"] = results[0] if not isinstance(results[0], Exception) else {"error": str(results[0])}
    result["disposable"] = results[1] if not isinstance(results[1], Exception) else {"error": str(results[1])}
    
    er_data = results[2]
    if not isinstance(er_data, Exception):
        result["emailrep"] = er_data.get("data") if er_data.get("success") else None
        result["scores"]["emailrep"] = score_emailrep(er_data)
        
    lc_data = results[3]
    if not isinstance(lc_data, Exception):
        result["leakcheck"] = lc_data if lc_data.get("success") and lc_data.get("found") else None
        result["scores"]["leakcheck"] = score_leakcheck(lc_data)
        
    xon_data = results[4]
    paste_data = results[5]
    if not isinstance(xon_data, Exception):
        result["xposedornot"] = xon_data if xon_data.get("success") and xon_data.get("found") else None
        result["scores"]["xposedornot"] = score_xposedornot(xon_data)
    if not isinstance(paste_data, Exception) and paste_data.get("success") and paste_data.get("found"):
        if not result["xposedornot"]: result["xposedornot"] = {}
        result["xposedornot"]["pastes"] = paste_data.get("pastes")
        result["xposedornot"]["pasteCount"] = paste_data.get("pasteCount")
        
    # Calculate score
    weights = {
        "syntax": 0.05,
        "patterns": 0.08,
        "dns": 0.22,
        "disposable": 0.10,
        "emailrep": 0.15,
        "leakcheck": 0.15,
        "xposedornot": 0.15,
        "domain": 0.10
    }
    
    is_major_provider = domain in MAJOR_PROVIDERS
    has_corp_tld = bool(re.search(r'\.(com|org|net|edu|gov|mil|int)$', domain, re.IGNORECASE))
    
    total_weight = 0
    weighted_score = 0
    
    weighted_score += 100 * weights["syntax"]
    total_weight += weights["syntax"]
    
    pattern_penalty = 0
    if result["patterns"]:
        for p in result["patterns"]:
            if p == 'Role-based email account':
                if is_major_provider: pattern_penalty += 0
                elif has_corp_tld: pattern_penalty += 5
                else: pattern_penalty += 12
            elif p == 'Suspicious top-level domain':
                pattern_penalty += 20
            elif p == 'Known high-risk pattern detected':
                pattern_penalty += 25
            elif p == 'Numeric-heavy local part':
                pattern_penalty += 10
            else:
                pattern_penalty += 8
        pattern_penalty = min(pattern_penalty, 70)
    
    weighted_score += (100 - pattern_penalty) * weights["patterns"]
    total_weight += weights["patterns"]
    
    if result.get("dns") and not result["dns"].get("error"):
        dns_score = 0
        if result["dns"]["mx"].get("hasMx"): dns_score += 50
        if result["dns"]["dns"].get("hasARecord"): dns_score += 20
        if is_major_provider and result["dns"]["mx"].get("hasMx"): dns_score = max(dns_score, 90)
        
        weighted_score += dns_score * weights["dns"]
        total_weight += weights["dns"]
        
    if result.get("disposable"):
        disp_score = 0 if result["disposable"].get("isDisposable") else 100
        weighted_score += disp_score * weights["disposable"]
        total_weight += weights["disposable"]
        
    if result["scores"].get("emailrep") and not result["scores"]["emailrep"].get("error"):
        er_rep = result["scores"]["emailrep"]
        emailrep_trust = er_rep.get("score", 0)
        if er_rep.get("reputation") == 'unknown' and not er_rep.get("suspicious") and len(er_rep.get("signals", [])) <= 1:
            emailrep_trust = max(emailrep_trust, 70)
        if is_major_provider and er_rep.get("reputation") == 'unknown':
            emailrep_trust = max(emailrep_trust, 80)
            
        weighted_score += emailrep_trust * weights["emailrep"]
        total_weight += weights["emailrep"]
        
    if result["scores"].get("leakcheck") and not result["scores"]["leakcheck"].get("error"):
        weighted_score += (100 - result["scores"]["leakcheck"].get("score", 0)) * weights["leakcheck"]
        total_weight += weights["leakcheck"]
        
    if result["scores"].get("xposedornot") and not result["scores"]["xposedornot"].get("error"):
        xon_risk = result["scores"]["xposedornot"].get("score", 0)
        if is_major_provider: xon_risk = round(xon_risk * 0.2)
        elif has_corp_tld: xon_risk = round(xon_risk * 0.6)
        
        weighted_score += (100 - xon_risk) * weights["xposedornot"]
        total_weight += weights["xposedornot"]
        
    domain_score = 100 if is_major_provider else (70 if has_corp_tld else 40)
    weighted_score += domain_score * weights["domain"]
    total_weight += weights["domain"]
    
    final_score = round(weighted_score / total_weight) if total_weight > 0 else 50
    
    if result.get("disposable") and result["disposable"].get("isDisposable"):
        final_score = min(final_score, 15)
    elif result.get("dns") and not result["dns"]["mx"].get("hasMx") and not result["dns"]["dns"].get("hasARecord"):
        final_score = min(final_score, 25)
        
    result["trustScore"] = max(0, min(100, final_score))
    
    score = result["trustScore"]
    if score >= 80: verdict = 'Safe'
    elif score >= 55: verdict = 'Low Risk'
    elif score >= 35: verdict = 'Caution'
    elif score >= 15: verdict = 'High Risk'
    else: verdict = 'Critical Risk'
    
    result["verdict"] = verdict
    result["riskLevel"] = verdict
    
    # Collect signals
    signals = set()
    if 'Role-based email account' in result["patterns"]: signals.add('ROLE_ACCOUNT')
    if 'Suspicious top-level domain' in result["patterns"]: signals.add('SUSPICIOUS_TLD')
    if 'Known high-risk pattern detected' in result["patterns"]: signals.add('HIGH_RISK_PATTERN')
    if 'Numeric-heavy local part' in result["patterns"]: signals.add('NUMERIC_HEAVY')
    
    if result.get("dns"):
        if result["dns"]["mx"].get("hasMx"): signals.add('HAS_MX_RECORD')
        else: signals.add('NO_MX_RECORD')
        
    if result.get("disposable") and result["disposable"].get("isDisposable"): signals.add('DISPOSABLE_EMAIL')
    
    if result["scores"].get("emailrep") and result["emailrep"]:
        if result["emailrep"].get("details", {}).get("credentials_leaked"): signals.add('CREDENTIALS_LEAKED')
        if result["emailrep"].get("details", {}).get("malicious_activity"): signals.add('MALICIOUS_ACTIVITY')
        if result["emailrep"].get("details", {}).get("spam"): signals.add('SPAM_SOURCE')
        if result["emailrep"].get("suspicious"): signals.add('SUSPICIOUS_REPUTATION')
        
    if result.get("leakcheck") and result["leakcheck"].get("found"): signals.add('DATA_BREACH_DETECTED')
    if result.get("xposedornot") and result["xposedornot"].get("found"): signals.add('BREACH_CONFIRMED')
    if result.get("xposedornot") and result["xposedornot"].get("pasteCount", 0) > 0: signals.add('PASTE_MENTIONED')
    
    result["signals"] = list(signals)
    result["executionTimeMs"] = int((datetime.now() - start_time).total_seconds() * 1000)
    
    return result

import logging
logger = logging.getLogger(__name__)

async def process_bulk_job(job_id: str, emails: list):
    from app.db.session import SessionLocal
    from app.db.models import PhylocBulkJob
    import uuid
    
    db = SessionLocal()
    try:
        results = []
        total = len(emails)
        job_uuid = uuid.UUID(job_id)
        
        for i, email in enumerate(emails):
            # Arbitrary short delay to not overwhelm external APIs
            await asyncio.sleep(0.2)
            
            res = await analyze_email_service(email)
            results.append(res)
            
            # Update job progress periodically
            job = db.query(PhylocBulkJob).filter(PhylocBulkJob.id == job_uuid).first()
            if job:
                job.results = results
                job.progress = int(((i + 1) / total) * 100)
                job.summary = f"Processing {i + 1} of {total} addresses..."
                db.commit()
                
        # Finalize job
        final_job = db.query(PhylocBulkJob).filter(PhylocBulkJob.id == job_uuid).first()
        if final_job:
            high_risk = sum(1 for r in results if r["verdict"] in ["High Risk", "Critical Risk"])
            caution = sum(1 for r in results if r["verdict"] == "Caution")
            
            final_job.status = "completed"
            final_job.progress = 100
            final_job.summary = f"{total} scanned, {high_risk} high/critical risk, {caution} caution."
            db.commit()
    except Exception as e:
        logger.error(f"Background bulk job failed: {e}", exc_info=True)
        try:
            job_uuid = uuid.UUID(job_id)
            job = db.query(PhylocBulkJob).filter(PhylocBulkJob.id == job_uuid).first()
            if job:
                job.status = "failed"
                job.summary = "Scan failed due to an internal error."
                db.commit()
        except Exception:
            pass
    finally:
        db.close()
