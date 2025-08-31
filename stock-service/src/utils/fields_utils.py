kpi_query ="""SELECT DISTINCT * FROM ( 
        SELECT regexp_replace('gross_profit_margin_bound', '_bound$', '') AS kpi_name, gross_profit_margin_bound AS kpi_value 
        FROM clean.financial_metrics_perc 
        WHERE gross_profit_margin_bound IS NOT NULL UNION ALL SELECT regexp_replace('ebit_margin_bound', '_bound$', '') AS kpi_name, ebit_margin_bound AS kpi_value 
        FROM clean.financial_metrics_perc 
        WHERE ebit_margin_bound IS NOT NULL UNION ALL SELECT regexp_replace('ebitda_margin_bound', '_bound$', '') AS kpi_name, ebitda_margin_bound AS kpi_value 
        FROM clean.financial_metrics_perc 
        WHERE ebitda_margin_bound IS NOT NULL UNION ALL SELECT regexp_replace('operating_profit_margin_bound', '_bound$', '') AS kpi_name, operating_profit_margin_bound AS kpi_value 
        FROM clean.financial_metrics_perc 
        WHERE operating_profit_margin_bound IS NOT NULL UNION ALL SELECT regexp_replace('pretax_profit_margin_bound', '_bound$', '') AS kpi_name, pretax_profit_margin_bound AS kpi_value 
        FROM clean.financial_metrics_perc 
        WHERE pretax_profit_margin_bound IS NOT NULL UNION ALL SELECT regexp_replace('continuous_operations_profit_margin_bound', '_bound$', '') AS kpi_name, continuous_operations_profit_margin_bound AS kpi_value 
        FROM clean.financial_metrics_perc 
        WHERE continuous_operations_profit_margin_bound IS NOT NULL UNION ALL SELECT regexp_replace('net_profit_margin_bound', '_bound$', '') AS kpi_name, net_profit_margin_bound AS kpi_value 
        FROM clean.financial_metrics_perc 
        WHERE net_profit_margin_bound IS NOT NULL UNION ALL SELECT regexp_replace('bottom_line_profit_margin_bound', '_bound$', '') AS kpi_name, bottom_line_profit_margin_bound AS kpi_value 
        FROM clean.financial_metrics_perc 
        WHERE bottom_line_profit_margin_bound IS NOT NULL UNION ALL SELECT regexp_replace('current_ratio_bound', '_bound$', '') AS kpi_name, current_ratio_bound AS kpi_value 
        FROM clean.financial_metrics_perc 
        WHERE current_ratio_bound IS NOT NULL UNION ALL SELECT regexp_replace('quick_ratio_bound', '_bound$', '') AS kpi_name, quick_ratio_bound AS kpi_value 
        FROM clean.financial_metrics_perc 
        WHERE quick_ratio_bound IS NOT NULL UNION ALL SELECT regexp_replace('solvency_ratio_bound', '_bound$', '') AS kpi_name, solvency_ratio_bound AS kpi_value 
        FROM clean.financial_metrics_perc 
        WHERE solvency_ratio_bound IS NOT NULL UNION ALL SELECT regexp_replace('cash_ratio_bound', '_bound$', '') AS kpi_name, cash_ratio_bound AS kpi_value 
        FROM clean.financial_metrics_perc 
        WHERE cash_ratio_bound IS NOT NULL UNION ALL SELECT regexp_replace('receivables_turnover_bound', '_bound$', '') AS kpi_name, receivables_turnover_bound AS kpi_value 
        FROM clean.financial_metrics_perc 
        WHERE receivables_turnover_bound IS NOT NULL UNION ALL SELECT regexp_replace('payables_turnover_bound', '_bound$', '') AS kpi_name, payables_turnover_bound AS kpi_value 
        FROM clean.financial_metrics_perc 
        WHERE payables_turnover_bound IS NOT NULL UNION ALL SELECT regexp_replace('inventory_turnover_bound', '_bound$', '') AS kpi_name, inventory_turnover_bound AS kpi_value 
        FROM clean.financial_metrics_perc 
        WHERE inventory_turnover_bound IS NOT NULL UNION ALL SELECT regexp_replace('fixed_asset_turnover_bound', '_bound$', '') AS kpi_name, fixed_asset_turnover_bound AS kpi_value 
        FROM clean.financial_metrics_perc 
        WHERE fixed_asset_turnover_bound IS NOT NULL UNION ALL SELECT regexp_replace('asset_turnover_bound', '_bound$', '') AS kpi_name, asset_turnover_bound AS kpi_value 
        FROM clean.financial_metrics_perc 
        WHERE asset_turnover_bound IS NOT NULL UNION ALL SELECT regexp_replace('working_capital_turnover_ratio_bound', '_bound$', '') AS kpi_name, working_capital_turnover_ratio_bound AS kpi_value 
        FROM clean.financial_metrics_perc 
        WHERE working_capital_turnover_ratio_bound IS NOT NULL UNION ALL SELECT regexp_replace('price_to_earnings_ratio_bound', '_bound$', '') AS kpi_name, price_to_earnings_ratio_bound AS kpi_value 
        FROM clean.financial_metrics_perc 
        WHERE price_to_earnings_ratio_bound IS NOT NULL UNION ALL SELECT regexp_replace('price_to_earnings_growth_ratio_bound', '_bound$', '') AS kpi_name, price_to_earnings_growth_ratio_bound AS kpi_value 
        FROM clean.financial_metrics_perc 
        WHERE price_to_earnings_growth_ratio_bound IS NOT NULL UNION ALL SELECT regexp_replace('forward_price_to_earnings_growth_ratio_bound', '_bound$', '') AS kpi_name, forward_price_to_earnings_growth_ratio_bound AS kpi_value 
        FROM clean.financial_metrics_perc 
        WHERE forward_price_to_earnings_growth_ratio_bound IS NOT NULL UNION ALL SELECT regexp_replace('price_to_book_ratio_bound', '_bound$', '') AS kpi_name, price_to_book_ratio_bound AS kpi_value 
        FROM clean.financial_metrics_perc 
        WHERE price_to_book_ratio_bound IS NOT NULL UNION ALL SELECT regexp_replace('price_to_sales_ratio_bound', '_bound$', '') AS kpi_name, price_to_sales_ratio_bound AS kpi_value 
        FROM clean.financial_metrics_perc 
        WHERE price_to_sales_ratio_bound IS NOT NULL UNION ALL SELECT regexp_replace('price_to_free_cash_flow_ratio_bound', '_bound$', '') AS kpi_name, price_to_free_cash_flow_ratio_bound AS kpi_value 
        FROM clean.financial_metrics_perc 
        WHERE price_to_free_cash_flow_ratio_bound IS NOT NULL UNION ALL SELECT regexp_replace('price_to_operating_cash_flow_ratio_bound', '_bound$', '') AS kpi_name, price_to_operating_cash_flow_ratio_bound AS kpi_value 
        FROM clean.financial_metrics_perc 
        WHERE price_to_operating_cash_flow_ratio_bound IS NOT NULL UNION ALL SELECT regexp_replace('price_to_fair_value_bound', '_bound$', '') AS kpi_name, price_to_fair_value_bound AS kpi_value 
        FROM clean.financial_metrics_perc 
        WHERE price_to_fair_value_bound IS NOT NULL UNION ALL SELECT regexp_replace('debt_to_assets_ratio_bound', '_bound$', '') AS kpi_name, debt_to_assets_ratio_bound AS kpi_value 
        FROM clean.financial_metrics_perc 
        WHERE debt_to_assets_ratio_bound IS NOT NULL UNION ALL SELECT regexp_replace('debt_to_equity_ratio_bound', '_bound$', '') AS kpi_name, debt_to_equity_ratio_bound AS kpi_value 
        FROM clean.financial_metrics_perc 
        WHERE debt_to_equity_ratio_bound IS NOT NULL UNION ALL SELECT regexp_replace('debt_to_capital_ratio_bound', '_bound$', '') AS kpi_name, debt_to_capital_ratio_bound AS kpi_value 
        FROM clean.financial_metrics_perc 
        WHERE debt_to_capital_ratio_bound IS NOT NULL UNION ALL SELECT regexp_replace('long_term_debt_to_capital_ratio_bound', '_bound$', '') AS kpi_name, long_term_debt_to_capital_ratio_bound AS kpi_value 
        FROM clean.financial_metrics_perc 
        WHERE long_term_debt_to_capital_ratio_bound IS NOT NULL UNION ALL SELECT regexp_replace('financial_leverage_ratio_bound', '_bound$', '') AS kpi_name, financial_leverage_ratio_bound AS kpi_value 
        FROM clean.financial_metrics_perc 
        WHERE financial_leverage_ratio_bound IS NOT NULL UNION ALL SELECT regexp_replace('debt_to_market_cap_bound', '_bound$', '') AS kpi_name, debt_to_market_cap_bound AS kpi_value 
        FROM clean.financial_metrics_perc 
        WHERE debt_to_market_cap_bound IS NOT NULL UNION ALL SELECT regexp_replace('operating_cash_flow_ratio_bound', '_bound$', '') AS kpi_name, operating_cash_flow_ratio_bound AS kpi_value 
        FROM clean.financial_metrics_perc 
        WHERE operating_cash_flow_ratio_bound IS NOT NULL UNION ALL SELECT regexp_replace('operating_cash_flow_sales_ratio_bound', '_bound$', '') AS kpi_name, operating_cash_flow_sales_ratio_bound AS kpi_value 
        FROM clean.financial_metrics_perc 
        WHERE operating_cash_flow_sales_ratio_bound IS NOT NULL UNION ALL SELECT regexp_replace('free_cash_flow_operating_cash_flow_ratio_bound', '_bound$', '') AS kpi_name, free_cash_flow_operating_cash_flow_ratio_bound AS kpi_value 
        FROM clean.financial_metrics_perc 
        WHERE free_cash_flow_operating_cash_flow_ratio_bound IS NOT NULL UNION ALL SELECT regexp_replace('debt_service_coverage_ratio_bound', '_bound$', '') AS kpi_name, debt_service_coverage_ratio_bound AS kpi_value 
        FROM clean.financial_metrics_perc 
        WHERE debt_service_coverage_ratio_bound IS NOT NULL UNION ALL SELECT regexp_replace('interest_coverage_ratio_bound', '_bound$', '') AS kpi_name, interest_coverage_ratio_bound AS kpi_value 
        FROM clean.financial_metrics_perc 
        WHERE interest_coverage_ratio_bound IS NOT NULL UNION ALL SELECT regexp_replace('short_term_operating_cash_flow_coverage_ratio_bound', '_bound$', '') AS kpi_name, short_term_operating_cash_flow_coverage_ratio_bound AS kpi_value 
        FROM clean.financial_metrics_perc 
        WHERE short_term_operating_cash_flow_coverage_ratio_bound IS NOT NULL UNION ALL SELECT regexp_replace('operating_cash_flow_coverage_ratio_bound', '_bound$', '') AS kpi_name, operating_cash_flow_coverage_ratio_bound AS kpi_value 
        FROM clean.financial_metrics_perc 
        WHERE operating_cash_flow_coverage_ratio_bound IS NOT NULL UNION ALL SELECT regexp_replace('capital_expenditure_coverage_ratio_bound', '_bound$', '') AS kpi_name, capital_expenditure_coverage_ratio_bound AS kpi_value 
        FROM clean.financial_metrics_perc 
        WHERE capital_expenditure_coverage_ratio_bound IS NOT NULL UNION ALL SELECT regexp_replace('dividend_paid_and_capex_coverage_ratio_bound', '_bound$', '') AS kpi_name, dividend_paid_and_capex_coverage_ratio_bound AS kpi_value 
        FROM clean.financial_metrics_perc 
        WHERE dividend_paid_and_capex_coverage_ratio_bound IS NOT NULL UNION ALL SELECT regexp_replace('dividend_payout_ratio_bound', '_bound$', '') AS kpi_name, dividend_payout_ratio_bound AS kpi_value 
        FROM clean.financial_metrics_perc 
        WHERE dividend_payout_ratio_bound IS NOT NULL UNION ALL SELECT regexp_replace('dividend_yield_bound', '_bound$', '') AS kpi_name, dividend_yield_bound AS kpi_value 
        FROM clean.financial_metrics_perc 
        WHERE dividend_yield_bound IS NOT NULL UNION ALL SELECT regexp_replace('dividend_yield_percentage_bound', '_bound$', '') AS kpi_name, dividend_yield_percentage_bound AS kpi_value 
        FROM clean.financial_metrics_perc 
        WHERE dividend_yield_percentage_bound IS NOT NULL UNION ALL SELECT regexp_replace('dividend_per_share_bound', '_bound$', '') AS kpi_name, dividend_per_share_bound AS kpi_value 
        FROM clean.financial_metrics_perc 
        WHERE dividend_per_share_bound IS NOT NULL UNION ALL SELECT regexp_replace('revenue_per_share_bound', '_bound$', '') AS kpi_name, revenue_per_share_bound AS kpi_value 
        FROM clean.financial_metrics_perc 
        WHERE revenue_per_share_bound IS NOT NULL UNION ALL SELECT regexp_replace('net_income_per_share_bound', '_bound$', '') AS kpi_name, net_income_per_share_bound AS kpi_value 
        FROM clean.financial_metrics_perc 
        WHERE net_income_per_share_bound IS NOT NULL UNION ALL SELECT regexp_replace('interest_debt_per_share_bound', '_bound$', '') AS kpi_name, interest_debt_per_share_bound AS kpi_value 
        FROM clean.financial_metrics_perc 
        WHERE interest_debt_per_share_bound IS NOT NULL UNION ALL SELECT regexp_replace('cash_per_share_bound', '_bound$', '') AS kpi_name, cash_per_share_bound AS kpi_value 
        FROM clean.financial_metrics_perc 
        WHERE cash_per_share_bound IS NOT NULL UNION ALL SELECT regexp_replace('book_value_per_share_bound', '_bound$', '') AS kpi_name, book_value_per_share_bound AS kpi_value 
        FROM clean.financial_metrics_perc 
        WHERE book_value_per_share_bound IS NOT NULL UNION ALL SELECT regexp_replace('tangible_book_value_per_share_bound', '_bound$', '') AS kpi_name, tangible_book_value_per_share_bound AS kpi_value 
        FROM clean.financial_metrics_perc 
        WHERE tangible_book_value_per_share_bound IS NOT NULL UNION ALL SELECT regexp_replace('shareholders_equity_per_share_bound', '_bound$', '') AS kpi_name, shareholders_equity_per_share_bound AS kpi_value 
        FROM clean.financial_metrics_perc 
        WHERE shareholders_equity_per_share_bound IS NOT NULL UNION ALL SELECT regexp_replace('operating_cash_flow_per_share_bound', '_bound$', '') AS kpi_name, operating_cash_flow_per_share_bound AS kpi_value 
        FROM clean.financial_metrics_perc 
        WHERE operating_cash_flow_per_share_bound IS NOT NULL UNION ALL SELECT regexp_replace('capex_per_share_bound', '_bound$', '') AS kpi_name, capex_per_share_bound AS kpi_value 
        FROM clean.financial_metrics_perc 
        WHERE capex_per_share_bound IS NOT NULL UNION ALL SELECT regexp_replace('free_cash_flow_per_share_bound', '_bound$', '') AS kpi_name, free_cash_flow_per_share_bound AS kpi_value 
        FROM clean.financial_metrics_perc 
        WHERE free_cash_flow_per_share_bound IS NOT NULL UNION ALL SELECT regexp_replace('net_income_per_ebt_bound', '_bound$', '') AS kpi_name, net_income_per_ebt_bound AS kpi_value 
        FROM clean.financial_metrics_perc 
        WHERE net_income_per_ebt_bound IS NOT NULL UNION ALL SELECT regexp_replace('ebt_per_ebit_bound', '_bound$', '') AS kpi_name, ebt_per_ebit_bound AS kpi_value 
        FROM clean.financial_metrics_perc 
        WHERE ebt_per_ebit_bound IS NOT NULL UNION ALL SELECT regexp_replace('effective_tax_rate_bound', '_bound$', '') AS kpi_name, effective_tax_rate_bound AS kpi_value 
        FROM clean.financial_metrics_perc 
        WHERE effective_tax_rate_bound IS NOT NULL UNION ALL SELECT regexp_replace('enterprise_value_multiple_bound', '_bound$', '') AS kpi_name, enterprise_value_multiple_bound AS kpi_value 
        FROM clean.financial_metrics_perc 
        WHERE enterprise_value_multiple_bound IS NOT NULL
        ) t
        ORDER BY kpi_name, kpi_value;
        """

country_codes = {
    "AD": "Andorra",
    "AE": "United Arab Emirates",
    "AF": "Afghanistan",
    "AG": "Antigua and Barbuda",
    "AI": "Anguilla",
    "AL": "Albania",
    "AM": "Armenia",
    "AO": "Angola",
    "AQ": "Antarctica",
    "AR": "Argentina",
    "AS": "American Samoa",
    "AT": "Austria",
    "AU": "Australia",
    "AW": "Aruba",
    "AX": "Åland Islands",
    "AZ": "Azerbaijan",
    "BA": "Bosnia and Herzegovina",
    "BB": "Barbados",
    "BD": "Bangladesh",
    "BE": "Belgium",
    "BF": "Burkina Faso",
    "BG": "Bulgaria",
    "BH": "Bahrain",
    "BI": "Burundi",
    "BJ": "Benin",
    "BL": "Saint Barthélemy",
    "BM": "Bermuda",
    "BN": "Brunei Darussalam",
    "BO": "Bolivia (Plurinational State of)",
    "BQ": "Bonaire, Sint Eustatius and Saba",
    "BR": "Brazil",
    "BS": "Bahamas",
    "BT": "Bhutan",
    "BV": "Bouvet Island",
    "BW": "Botswana",
    "BY": "Belarus",
    "BZ": "Belize",
    "CA": "Canada",
    "CC": "Cocos (Keeling) Islands",
    "CD": "Congo (Democratic Republic of the)",
    "CF": "Central African Republic",
    "CG": "Congo",
    "CH": "Switzerland",
    "CI": "Côte d'Ivoire",
    "CK": "Cook Islands",
    "CL": "Chile",
    "CM": "Cameroon",
    "CN": "China",
    "CO": "Colombia",
    "CR": "Costa Rica",
    "CU": "Cuba",
    "CV": "Cabo Verde",
    "CW": "Curaçao",
    "CX": "Christmas Island",
    "CY": "Cyprus",
    "CZ": "Czechia",
    "DE": "Germany",
    "DJ": "Djibouti",
    "DK": "Denmark",
    "DM": "Dominica",
    "DO": "Dominican Republic",
    "DZ": "Algeria",
    "EC": "Ecuador",
    "EE": "Estonia",
    "EG": "Egypt",
    "EH": "Western Sahara",
    "ER": "Eritrea",
    "ES": "Spain",
    "ET": "Ethiopia",
    "FI": "Finland",
    "FJ": "Fiji",
    "FM": "Micronesia (Federated States of)",
    "FO": "Faroe Islands",
    "FR": "France",
    "GA": "Gabon",
    "GB": "United Kingdom of Great Britain and Northern Ireland",
    "GD": "Grenada",
    "GE": "Georgia",
    "GF": "French Guiana",
    "GG": "Guernsey",
    "GH": "Ghana",
    "GI": "Gibraltar",
    "GL": "Greenland",
    "GM": "Gambia",
    "GN": "Guinea",
    "GP": "Guadeloupe",
    "GQ": "Equatorial Guinea",
    "GR": "Greece",
    "GS": "South Georgia and the South Sandwich Islands",
    "GT": "Guatemala",
    "GU": "Guam",
    "GW": "Guinea-Bissau",
    "GY": "Guyana",
    "HK": "Hong Kong",
    "HM": "Heard Island and McDonald Islands",
    "HN": "Honduras",
    "HR": "Croatia",
    "HT": "Haiti",
    "HU": "Hungary",
    "ID": "Indonesia",
    "IE": "Ireland",
    "IL": "Israel",
    "IM": "Isle of Man",
    "IN": "India",
    "IO": "British Indian Ocean Territory",
    "IQ": "Iraq",
    "IR": "Iran (Islamic Republic of)",
    "IS": "Iceland",
    "IT": "Italy",
    "JE": "Jersey",
    "JM": "Jamaica",
    "JO": "Jordan",
    "JP": "Japan",
    "KE": "Kenya",
    "KG": "Kyrgyzstan",
    "KH": "Cambodia",
    "KI": "Kiribati",
    "KM": "Comoros",
    "KN": "Saint Kitts and Nevis",
    "KP": "Korea (Democratic People's Republic of)",
    "KR": "Korea (Republic of)",
    "KW": "Kuwait",
    "KY": "Cayman Islands",
    "KZ": "Kazakhstan",
    "LA": "Lao People's Democratic Republic",
    "LB": "Lebanon",
    "LC": "Saint Lucia",
    "LI": "Liechtenstein",
    "LK": "Sri Lanka",
    "LR": "Liberia",
    "LS": "Lesotho",
    "LT": "Lithuania",
    "LU": "Luxembourg",
    "LV": "Latvia",
    "LY": "Libya",
    "MA": "Morocco",
    "MC": "Monaco",
    "MD": "Moldova (Republic of)",
    "ME": "Montenegro",
    "MF": "Saint Martin (French part)",
    "MG": "Madagascar",
    "MH": "Marshall Islands",
    "MK": "North Macedonia",
    "ML": "Mali",
    "MM": "Myanmar",
    "MN": "Mongolia",
    "MO": "Macao",
    "MP": "Northern Mariana Islands",
    "MQ": "Martinique",
    "MR": "Mauritania",
    "MS": "Montserrat",
    "MT": "Malta",
    "MU": "Mauritius",
    "MV": "Maldives",
    "MW": "Malawi",
    "MX": "Mexico",
    "MY": "Malaysia",
    "MZ": "Mozambique",
    "NA": "Namibia",
    "NC": "New Caledonia",
    "NE": "Niger",
    "NF": "Norfolk Island",
    "NG": "Nigeria",
    "NI": "Nicaragua",
    "NL": "Netherlands",
    "NO": "Norway",
    "NP": "Nepal",
    "NR": "Nauru",
    "NU": "Niue",
    "NZ": "New Zealand",
    "OM": "Oman",
    "PA": "Panama",
    "PE": "Peru",
    "PF": "French Polynesia",
    "PG": "Papua New Guinea",
    "PH": "Philippines",
    "PK": "Pakistan",
    "PL": "Poland",
    "PM": "Saint Pierre and Miquelon",
    "PN": "Pitcairn",
    "PR": "Puerto Rico",
    "PS": "Palestine, State of",
    "PT": "Portugal",
    "PW": "Palau",
    "PY": "Paraguay",
    "QA": "Qatar",
    "RE": "Réunion",
    "RO": "Romania",
    "RS": "Serbia",
    "RU": "Russian Federation",
    "RW": "Rwanda",
    "SA": "Saudi Arabia",
    "SB": "Solomon Islands",
    "SC": "Seychelles",
    "SD": "Sudan",
    "SE": "Sweden",
    "SG": "Singapore",
    "SH": "Saint Helena, Ascension and Tristan da Cunha",
    "SI": "Slovenia",
    "SJ": "Svalbard and Jan Mayen",
    "SK": "Slovakia",
    "SL": "Sierra Leone",
    "SM": "San Marino",
    "SN": "Senegal",
    "SO": "Somalia",
    "SR": "Suriname",
    "SS": "South Sudan",
    "ST": "Sao Tome and Principe",
    "SV": "El Salvador",
    "SX": "Sint Maarten (Dutch part)",
    "SY": "Syrian Arab Republic",
    "SZ": "Eswatini",
    "TC": "Turks and Caicos Islands",
    "TD": "Chad",
    "TF": "French Southern Territories",
    "TG": "Togo",
    "TH": "Thailand",
    "TJ": "Tajikistan",
    "TK": "Tokelau",
    "TL": "Timor-Leste",
    "TM": "Turkmenistan",
    "TN": "Tunisia",
    "TO": "Tonga",
    "TR": "Türkiye",
    "TT": "Trinidad and Tobago",
    "TV": "Tuvalu",
    "TZ": "Tanzania, United Republic of",
    "UA": "Ukraine",
    "UG": "Uganda",
    "UM": "United States Minor Outlying Islands",
    "US": "United States of America",
    "UY": "Uruguay",
    "UZ": "Uzbekistan",
    "VA": "Holy See",
    "VC": "Saint Vincent and the Grenadines",
    "VE": "Venezuela (Bolivarian Republic of)",
    "VG": "Virgin Islands (British)",
    "VI": "Virgin Islands (U.S.)",
    "VN": "Viet Nam",
    "VU": "Vanuatu",
    "WF": "Wallis and Futuna",
    "WS": "Samoa",
    "YE": "Yemen",
    "YT": "Mayotte",
    "ZA": "South Africa",
    "ZM": "Zambia",
    "ZW": "Zimbabwe"
}
