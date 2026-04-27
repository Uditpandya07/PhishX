import pytest
from app.services.feature_extractor import extract_features

def test_extract_features_length():
    url = "http://google.com"
    features = extract_features(url)
    assert len(features) == 20
    # URL Length
    assert features[0] == len(url)

def test_extract_features_dots():
    url = "http://sub.domain.com/path.html"
    features = extract_features(url)
    # 2. Number of Dots (sub, domain, com, html) = 3 dots
    assert features[1] == 3

def test_extract_features_https():
    assert extract_features("https://secure.com")[5] == 1
    assert extract_features("http://insecure.com")[5] == 0

def test_extract_features_punycode():
    # 17. Punycode Detection
    assert extract_features("http://xn--80ak6aa92e.com")[16] == 1
    assert extract_features("http://google.com")[16] == 0

def test_extract_features_shortener():
    # 14. URL Shortener Detection
    assert extract_features("http://bit.ly/123")[13] == 1
    assert extract_features("http://google.com")[13] == 0
