
import sys
import json
import os

# Add the src directory to Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'src'))

# Import the index maker
from index_maker import create_custom_index

# Parse the parameters from command line arguments
params = json.loads('''{"indexSize":100,"indexCurrency":"USD","indexStartDate":"2014-01-01","indexEndDate":"2025-08-31","selectedCountries":["US"],"selectedSectors":["Technology"],"selectedIndustries":["Aerospace & Defense","Communication Equipment","Computer Hardware","Consumer Electronics","Education & Training Services","Electronic Gaming & Multimedia","Hardware","Information Technology Services","Internet Content & Information","Media & Entertainment","Semiconductors","Software - Application","Software - Infrastructure","Software - Services","Solar","Technology Distributors"],"selectedKPIs":{"net_profit_margin_perc":[60,70,80,90,99],"price_to_earnings_ratio_perc":[60,70,50,80,90,99]},"selectedStocks":["PLTR"]}''')

# Create the custom index
result = create_custom_index(
    index_size=params['indexSize'],
    currency=params['indexCurrency'],
    start_date=params['indexStartDate'],
    end_date=params['indexEndDate'],
    countries=params['selectedCountries'],
    sectors=params['selectedSectors'],
    industries=params['selectedIndustries'],
    kpis=params['selectedKPIs'],
    stocks=params['selectedStocks']
)

# Ensure we only print the JSON result, not any debug prints
print(json.dumps(result))
