from openrank_sdk import EigenTrust
import requests
from dotenv import load_dotenv
import os
from pprint import pprint

load_dotenv()

ENV_ID = os.getenv("NEXT_PUBLIC_ENV_ID")
TABLE_ID = os.getenv("NEXT_PUBLIC_ASSERTION_TABLE")

url = "https://studio.useorbis.com/api/db/query/json"
body = {
    "jsonQuery": {
        "$raw": {
            "query": f"SELECT * FROM {TABLE_ID}",
            "params": []
        }
    },
    "env": ENV_ID
}
headers = {
    "Content-Type": "application/json"
}

class ReputationCalculator:
    def __init__(self):
        self.cache = None

    def calculate(self):
        lt = {}
        lt2 = {}
        gt = {}
        print(body)
        if self.cache is None:
            # Perform the reputation calculation
            response = requests.post(url=url, headers=headers, json=body)
            if response.status_code == 200:
                data = response.json()
                # iterate through data.data.length
                for i in range(len(data["data"])):
                    controller = data["data"][i]["controller"]
                    recipient = data["data"][i]["agentId"]
                    # Add error checking for trustworthiness
                    if "trustworthiness" not in data["data"][i] or not isinstance(data["data"][i]["trustworthiness"], list):
                        print(f"Error: Missing or invalid trustworthiness data for item {i}")
                        print(data["data"][i])
                        continue
                    # iterate through the trustworthiness key (which is an array)
                    for j in range(len(data["data"][i]["trustworthiness"])):
                        # if sub array is undefined, skip
                        if data["data"][i]["trustworthiness"][j] is None:
                            continue
                        scope = data["data"][i]["trustworthiness"][j]["scope"]
                        new_obj = {
                            "i": controller,
                            "j": recipient,
                            "v": data["data"][i]["trustworthiness"][j]["level"]
                        }
                        # Append to respective scope
                        if scope not in lt:
                            lt[scope] = []
                        lt[scope].append(new_obj)
                        
            else:
                print(f"Error: {response.status_code}")
                print(response.text)

            # # Create symmetric book-to-user arc (used for non symmetric trustworthiness)
            # for key in lt:
            #     if key not in lt2:
            #         lt2[key] = []
            #     for row in lt[key]:
            #         lt2[key].append(row)
            #         lt2[key].append({'i': row['j'], 'j': row['i'], 'v': row['v']})


            # Initialize EigenTrust with alpha=0 and max_iterations=2
            eigentrust = EigenTrust(alpha=0, max_iterations=2)

            # Iterate through each scope's trustworthiness array
            # for key in lt2:
            for key in lt:
                # localtrust = lt2[key]
                localtrust = lt[key]
                # pretrust = [dict(i=localtrust[0].get('j'), v=1)]

                # Option A - Run EigenTrust algorithm - Use local variable
                # globaltrust = eigentrust.run_eigentrust(localtrust, pretrust)
                globaltrust = eigentrust.run_eigentrust(localtrust)

                globaltrust.sort(key=lambda row: row['i'])
                
                if key not in gt:
                    gt[key] = []
                gt[key].append(globaltrust)
            pprint(gt)
            self.cache = gt
        return self.cache

    def reset(self):
        self.cache = None
