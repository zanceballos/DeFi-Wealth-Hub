from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import yfinance as yf

app = FastAPI(title="YFinance Price API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/price/{ticker}")
def get_price(ticker: str):
    try:
        data = yf.Ticker(ticker)
        info = data.fast_info
        price = info.last_price
        if price is None:
            raise HTTPException(status_code=404, detail=f"No price found for {ticker}")
        return {
            "ticker": ticker.upper(),
            "price": price,
            "currency": info.currency,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/health")
def health():
    return {"status": "ok"}
