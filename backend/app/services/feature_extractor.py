import re
import math
from urllib.parse import urlparse

def calculate_entropy(text):
    if not text: return 0
    entropy = 0
    for x in set(text):
        p_x = float(text.count(x)) / len(text)
        entropy += - p_x * math.log2(p_x)
    return entropy

def extract_features(url):
    url = str(url).lower()
    parsed = urlparse(url)
    domain = parsed.netloc or parsed.path.split('/')[0]

    features = []
    
    # --- The Original 10 Features ---
    features.append(len(url))                                     # 1. URL Length
    features.append(url.count('.'))                               # 2. Number of Dots
    features.append(url.count('-'))                               # 3. Number of Hyphens
    features.append(url.count('@'))                               # 4. Number of @ Symbols
    features.append(sum(c.isdigit() for c in url))                # 5. Number of Digits
    features.append(1 if url.startswith("https") else 0)          # 6. HTTPS Presence
    
    ip_pattern = r'^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$'
    features.append(1 if re.match(ip_pattern, domain) else 0)     # 7. IP in Domain
    
    features.append(calculate_entropy(domain))                    # 8. Domain Entropy
    
    suspicious_words = ['login', 'verify', 'update', 'secure', 'bank', 'account', 'auth', 'cmd', 'admin', 'payment']
    features.append(sum(1 for word in suspicious_words if word in url)) # 9. Suspicious Keywords
    
    features.append(len(parsed.path))                             # 10. Path Length

    # --- THE NEW V2 AGGRESSIVE FEATURES ---
    
    # 11. Suspicious TLDs (Cheap/Free domains heavily abused by hackers)
    cheap_tlds = ['.xyz', '.top', '.tk', '.biz', '.info', '.club', '.online', '.site']
    features.append(1 if any(domain.endswith(tld) for tld in cheap_tlds) else 0)
    
    # 12. Directory Depth (How deeply buried is the page?)
    features.append(parsed.path.count('/'))
    
    # 13. Query Parameter Length (Catches massively long ?token=... strings)
    features.append(len(parsed.query))
    
    # 14. URL Shortener Detection
    shorteners = ['bit.ly', 'tinyurl', 'goo.gl', 't.co', 'ow.ly', 'is.gd', 'buff.ly']
    features.append(1 if any(short in domain for short in shorteners) else 0)
    
    # 15. Redirection Tricks (Double slashes in the path)
    features.append(1 if '//' in parsed.path else 0)

    # --- THE V3 ELITE FEATURES ---
    
    # 16. Subdomain Count (More subdomains = higher risk of smuggling)
    subdomains = domain.split('.')
    # Exclude 'www' and the TLD
    features.append(max(0, len(subdomains) - 2) if len(subdomains) > 2 else 0)
    
    # 17. Punycode Detection (Detects "homograph" attacks like googlė.com)
    features.append(1 if "xn--" in domain else 0)
    
    # 18. Digit Ratio in Domain (Random looking domains often have many numbers)
    features.append(sum(c.isdigit() for c in domain) / len(domain) if len(domain) > 0 else 0)
    
    # 19. Non-Standard Port Usage
    features.append(1 if parsed.port and parsed.port not in [80, 443] else 0)
    
    # 20. Tilde Presence (Common in legacy personal sites and phishing kits)
    features.append(1 if '~' in url else 0)

    return features