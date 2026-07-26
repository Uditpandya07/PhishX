import stripe
import os
from dotenv import load_dotenv

load_dotenv()
stripe.api_key = os.getenv("STRIPE_API_KEY")

try:
    pro_product = stripe.Product.create(name="PhishX Pro")
    pro_price = stripe.Price.create(
        product=pro_product.id,
        unit_amount=999,
        currency="usd",
        recurring={"interval": "month"},
    )
    print(f"PRO_PRICE_ID={pro_price.id}")

    ent_product = stripe.Product.create(name="PhishX Enterprise")
    ent_price = stripe.Price.create(
        product=ent_product.id,
        unit_amount=4999,
        currency="usd",
        recurring={"interval": "month"},
    )
    print(f"ENTERPRISE_PRICE_ID={ent_price.id}")
except Exception as e:
    print(f"Error: {e}")
