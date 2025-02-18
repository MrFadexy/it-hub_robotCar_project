from flask import Flask, render_template, jsonify, request
import webbrowser as wb
import os
import json

app = Flask(__name__)

wb.open('http://127.0.0.1:8080/')

# Helper function to get the data.json file path
def get_data_file_path():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    return os.path.join(base_dir, '..', 'data.json')

from flask import Flask, request, jsonify

app = Flask(__name__)

@app.route('/start-car-arduino', methods=['POST'])
def start_car_arduino():
    # Parse the incoming JSON data
    data = request.get_json()

    # Validate if both 'ip' and 'module' are present in the request
    ip = data.get('ip')
    module = data.get('module')

    if not ip or not module:
        return jsonify({"error": "Both IP and module are required."}), 400

    try:
        # Logic to start the car (replace this with actual logic to start the car)
        # Example: call some Arduino interface or device control system
        # For now, we'll just simulate success.

        # If you successfully start the car, return a success message
        return jsonify({
            "message": f"Car with IP: {ip} and Module: {module} started successfully!"
        }), 200

    except Exception as e:
        # Handle any unexpected errors
        return jsonify({"error": "Failed to start car on Arduino", "details": str(e)}), 500


@app.route('/updateCustomName', methods=['PUT'])
def update_custom_name():
    try:
        file_path = get_data_file_path()
        data = request.get_json()
        robot_car_id = data.get('robotCarId')
        customRobotName = data.get('customRobotName')

        if customRobotName != '' and robot_car_id != '':
            

            with open(file_path, 'r') as json_file:
                data = json.load(json_file)
                data['RobotCarIDs'][str(robot_car_id)]['customName'] = customRobotName
                with open(file_path, 'w') as json_file:
                    json.dump(data, json_file, indent=2)
                    return jsonify({'message': 'Custom name updated'}), 200

        return jsonify({"error": "Missing RobotCarId or customName key"}), 400

    except FileNotFoundError:
        return jsonify({"error": "data.json file not found"}), 404
    except json.JSONDecodeError:
        return jsonify({"error": "Error decoding JSON"}), 500
    except Exception as e:
        print(e)
        return jsonify({"error": str(e)}), 501

    
@app.route('/deleteAllData', methods=['POST'])
def clear_data():
    file_path = get_data_file_path()

    try:
        with open(file_path, 'w') as json_file:
            json.dump({"RobotCarIDs" : {}}, json_file, indent=2)
        return jsonify({"message": "Data cleared successfully"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/get-data', methods=['GET'])
def get_data():
    file_path = get_data_file_path()

    try:
        with open(file_path, 'r') as json_file:
            data = json.load(json_file)
        return jsonify(data)  # Return the data as a JSON response
    except FileNotFoundError:
        return jsonify({"error": "data.json file not found"}), 404
    except json.JSONDecodeError:
        return jsonify({"error": "Error decoding JSON"}), 500

@app.route('/delete-key', methods=['DELETE'])
def delete_key():
    file_path = get_data_file_path()
    key_to_delete = request.json.get('key')  # Expecting the key in the request body

    try:
        # Read the current data
        with open(file_path, 'r') as json_file:
            data = json.load(json_file)

        # Check if data is a dictionary or a list of dictionaries
        if isinstance(data, dict):
            if key_to_delete in data:
                del data[key_to_delete]
            else:
                return jsonify({"error": f"Key '{key_to_delete}' not found"}), 404
        elif isinstance(data, list):
            data = [item for item in data if item.get('key') != key_to_delete]

        # Write the updated data back to the file
        with open(file_path, 'w') as json_file:
            json.dump(data, json_file, indent=2)

        return jsonify({"message": f"Key '{key_to_delete}' deleted successfully"}), 200
    except FileNotFoundError:
        return jsonify({"error": "data.json file not found"}), 404
    except json.JSONDecodeError:
        return jsonify({"error": "Error decoding JSON"}), 500
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/updateBestTime', methods=['PUT'])
def update_best_time():
    data = request.get_json()
    ip = data.get('ip')
    robotId = data.get('robotId')
    currentTime = data.get('currentTime')

    print(currentTime)
    print(ip)

    if not ip or not currentTime:
        return jsonify({'error': 'IP and best_time are required'}), 400

    # Load existing data
    file_path = get_data_file_path()
    with open(file_path, 'r') as f:
        robot_data = json.load(f)

    # Find the robot car by IP and update the best time
    for robot_id, robot in robot_data['RobotCarIDs'].items():
        if robot['Arduino']['ip'] == ip:
            if('bestTime' in robot_data['RobotCarIDs'][str(robotId)]):
                if(currentTime < robot['bestTime']):
                    robot['bestTime'] = currentTime
                    status = jsonify({'success': True})
                    break
                else:
                    return jsonify({'success': False})
            else:
                robot['bestTime'] = currentTime
                status = jsonify({'success': True})
                break
    else:
        return jsonify({'error': 'Robot car not found'}), 404

    # Save the updated data back to the file
    with open(file_path, 'w') as f:
        json.dump(robot_data, f, indent=4)

    return status, 200


@app.route("/")
def index():
    return render_template('pages/homepage.html')

@app.route("/scoreboard")
def run():
    return render_template('pages/scoreboard.html')

@app.errorhandler(404)
def page_not_found(e):
    return render_template('pages/404.html')

if __name__ == '__main__':
    app.run(debug=True, port=8080)
