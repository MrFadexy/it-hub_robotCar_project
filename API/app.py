from flask import Flask, request, jsonify
import socket
import logging
import json

app = Flask(__name__)

data_file = '../data.json'

def save_data(data):
    print(data)
    required_keys = ['ip', 'robotCarID', 'mac', 'deviceName']
    
    # Check that the required keys exist in the incoming data
    for key in required_keys:
        if key not in data:
            return {"message": f"Key {key} does not exist"}, 403

    robotCarID = str(data['robotCarID'])
    data.pop("robotCarID")  # Remove robotCarID from data to avoid overwriting

    # Read existing data from the JSON file
    with open(data_file, "r") as f:
        file_data = json.load(f)

    # Ensure the RobotCarIDs key exists
    if "RobotCarIDs" not in file_data:
        file_data["RobotCarIDs"] = {}

    # If robotCarID doesn't exist, create it
    if robotCarID not in file_data["RobotCarIDs"]:
        file_data["RobotCarIDs"][robotCarID] = {}

    # Check if the data includes the 'camera_feed' key
    if "camera_feed" in data:
        # If it contains camera_feed, update or add it directly under the robotCarID
        file_data["RobotCarIDs"][robotCarID]["ip"] = data["ip"]
        file_data["RobotCarIDs"][robotCarID]["mac"] = data["mac"]
        file_data["RobotCarIDs"][robotCarID]["deviceName"] = data["deviceName"]
        file_data["RobotCarIDs"][robotCarID]["camera_feed"] = data["camera_feed"]
    else:
        # If no camera_feed, it must be the Arduino data, so add it under 'Arduino'
        file_data["RobotCarIDs"][robotCarID]["Arduino"] = {
            "ip": data["ip"],
            "mac": data["mac"],
            "deviceName": data["deviceName"]
        }

    # Write the updated data back to the JSON file
    with open(data_file, "w") as f:
        json.dump(file_data, f, indent=4)

    return {"message": "success"}, 200



@app.route('/init/', methods=['POST'])
def init():
    data = request.json
    return save_data(data)

@app.route('/status/', methods=['get'])
def test():
    return jsonify({"status": "success"}), 200

if __name__ == '__main__':
    app.run(host="0.0.0.0", port=82, debug=False)