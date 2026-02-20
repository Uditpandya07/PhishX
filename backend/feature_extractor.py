import re
from urllib.parse import urlparse

def extract_features(url):
    features = []

    # Length of URL
    features.append(len(url))

    # Count of dots
    features.append(url.count('.'))

    # Count of hyphens
    features.append(url.count('-'))

    # Count of @ symbols
    features.append(url.count('@'))

    # Count of digits
    features.append(sum(c.isdigit() for c in url))

    # HTTPS check
    features.append(1 if url.startswith("https") else 0)

    # IP address check
    ip_pattern = r'(\d{1,3}\.){3}\d{1,3}'
    features.append(1 if re.search(ip_pattern, url) else 0)

    return features