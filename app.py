import csv
import json

# Read CSV and convert to JSON
data = []
with open('app.csv', 'r') as file:
    csv_reader = csv.DictReader(file)
    for row in csv_reader:
        data.append(row)

# Convert to JSON
json_data = json.dumps(data, indent=4)

# Save JSON to file
with open('app.json', 'w') as json_file:
    json_file.write(json_data)

print("CSV converted to JSON and saved as app.json")

# Function to check if input qualifies
def check_qualify(input_codes_str, data):
    input_codes = [code.strip() for code in input_codes_str.split(',')]
    input_set = set(input_codes)
    for row in data:
        row_values = [value for key, value in row.items() if key != 'Option']
        if set(row_values) == input_set:
            return row['Option'], "matchup"
    return None, "no match"

# Example usage
user_input = input("Enter codes separated by commas (e.g., 3C,3G,3B,3D,3A,3F,3E,3K): ")
option, result = check_qualify(user_input, data)
if option:
    print(f"Option: {option}, {result}")
else:
    print(result)