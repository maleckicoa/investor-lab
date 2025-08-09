.PHONY: daily historical daily-schedule daily-forex daily-price-volume daily-mcap daily-fx-price-volume daily-fx-mcap frontend-setup frontend-dev frontend-build frontend-start

daily:
	poetry run --directory etl-service python -m daily_main --run-now

daily-schedule:
	poetry run --directory etl-service python -m daily_main

daily-forex:
	poetry run --directory etl-service python -m src.daily.daily_forex

daily-price-volume:
	poetry run --directory etl-service python -m src.daily.daily_price_volume

daily-mcap:
	poetry run --directory etl-service python -m src.daily.daily_market_cap


daily-fx-price-volume: daily-forex daily-price-volume

daily-fx-mcap: daily-forex daily-mcap



historical:
	poetry run --directory etl-service python -m historical_main

# Frontend targets
frontend-setup:
	cd frontend && ./setup.sh

frontend-dev:
	cd frontend && npm run dev

frontend-build:
	cd frontend && npm run build

frontend-start:
	cd frontend && npm start
