let robotCarsData; // Declare it globally
var currentRobots = [];
let timer = false;
let carsTimer = [];

const parent = document.getElementsByClassName("robotCarContainer")[0];

async function getData() {
  try {
    const response = await fetch("/get-data");
    const data = await response.json();
    robotCarsData = data['RobotCarIDs']; // Store data in the global variable
  } catch (e) {
    console.error("Error fetching data:", e);
  }
}

// Initialize the data
getData().then(() => {
  loadRobotCars();
  orderCars();
  console.log(carsTimer);
});

function syncRobotCars() {
  const parent = document.getElementsByClassName("robotCarContainer")[0];

  console.log(parent.children);

  // for(let i = 0; i < )
}

function getUnactiveIps() {
  let activeIps = carsTimer
    .filter(item => item.active === false)
    .map(item => item.ip);

  return activeIps;
}

function setActive(ip, status) {
  let car = carsTimer.find(item => item.ip === ip);
  if (car) {
    car.active = status;
  }
}

function startAllCars() {
  for(let i = 0; i < parent.children.length; i++) {
    let robotCarIp = parent.children[i].id;
    startCarByIp(robotCarIp);
    
    setActive(robotCarIp, true);
    startTimer(robotCarIp);
  }
}

function stopCar(robotId, ip) {
  let carIp = "http://" + ip + "/stopRobot";
  try {
    fetch(carIp, {
      method: "POST",
      mode: "no-cors",
      headers: {
        "Content-Type": "application/json"
      }
    });
    orderCars();
    stopTimer(robotId, ip);
    setActive(ip, false);
  }
  catch (e) {
    console.error("Couldn't stop car:", e);
  }
}

function startAllSelectedCars() {
  let robotCars = document.querySelectorAll(".selectRobotCar");
  for(let i = 0; i < robotCars.length; i++) {
    let selected = robotCars[i].checked;
    if(selected) {
      let ip = robotCars[i].getAttribute("data-robot_ip");
      startCarByIp(ip);
      setActive(ip, true);
      startTimer(ip);
    }
  }
}

function editCustomName(robotCarId, ip) {
  Swal.fire({
    title: "Bewerk de naam van de robot:",
    input: "text",
    confirmButtonText: "Bevestig",
    cancelButtonText: "Annuleer",
    showCancelButton: true,
    showCloseButton: true,
    preConfirm: (customName) => {
      if(customName == "") {
        Swal.fire({
          icon: "error",
          title: "Het invoerveld mag niet leeg zijn..."
        });
      }
      else {
        try {
          const response = fetch("/updateCustomName", {
            method: "PUT",
            body: JSON.stringify({
              robotCarId: robotCarId,
              customRobotName: customName
            }),
            headers: {
              "Content-Type": "application/json"
            }
          });
          Swal.fire({
            icon: "success",
            title: "Robotnaam is veranderd!"
          });
          console.log(ip);
          let car = document.getElementById(ip);
          console.log(car);
          let carTitle = car.querySelector(".robotName");
          carTitle.innerText = customName;
        }
        catch (e) {
          Swal.fire({
            icon: "error",
            title: "Er is iets fout gegaan"
          });
          console.log(e);
        }
      }
    }
  });
}

async function stopTimer(robotId, ip) {
  const robotCar = document.getElementById(ip);
  robotCar.style.borderColor = "rgba(0, 0, 0, 0.176)";
  let car = carsTimer.find(item => item.ip === ip);
  if (car) {
    if (car.active) {
      if (car.interval) {
        clearInterval(car.interval);
        car.interval = null;
        const robotCar = document.getElementById(ip);
        const timer = robotCar.querySelector(".timer");
        try {
          let response = await fetch("/updateBestTime", {
            method: "PUT",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              ip: ip,
              currentTime: timer.innerText,
              robotId: robotId
            })
          });
          const responseStatus = await response.json();
          if(responseStatus.success) {
            document.getElementById(`bestTime_${ip}`).innerText = "Beste tijd: " + timer.innerText;
          }
          document.getElementById(`lastTime_${ip}`).innerText = "Laatste tijd: " + timer.innerText;
          timer.innerText = "00:00";
          orderCars();
          stopTimer(ip);
          setActive(ip, false);
        }
        catch (e) {
          console.error("Couldn't stop car:", e);
        }
      } else {
        console.log(`Interval already running for car with IP: ${ip}`);
      }
    } else {
      console.log(`Car with IP ${ip} is not active.`);
    }
  } else {
    console.log(`Car with IP ${ip} not found.`);
  }
}

function startTimer(ip) {
  const robotCar = document.getElementById(ip);
  robotCar.style.borderColor = "green";
  const timer = robotCar.querySelector(".timer");
  console.log(timer);
  let car = carsTimer.find(item => item.ip === ip);
  if (car) {
    if (car.active) {
      if (!car.interval) {
        const timer = document.getElementById(`timer_${ip}`);
        let currentTime = timer.innerText;
        let getTime = currentTime.split(":");

        car.interval = setInterval(() => {
          if(getTime[1] >= 59) {
            getTime[0]++;
            getTime[1] = -1;
          }
          getTime[1]++;
          console.log(getTime);

          let textTime = [String(getTime[0]), String(getTime[1])];
          if(textTime[0].length === 1) {
            textTime[0] = "0" + textTime[0];
          }
          if(textTime[1].length === 1){
            textTime[1] = "0" + textTime[1];
          }
          console.log(textTime);
          timer.innerText = textTime.join(":");
          console.log(textTime.join(":"));
          console.log(timer.innerText);
        }, 1000);
      } else {
        console.log(`Interval already running for car with IP: ${ip}`);
      }
    } else {
      console.log(`Car with IP ${ip} is not active.`);
    }
  } else {
    console.log(`Car with IP ${ip} not found.`);
  }
}

function orderCars() {
  const allRobotCars = document.querySelectorAll(".robotCar");

  var timerList = [];
  for(let i = 0; i < allRobotCars.length; i++) {
    let timer = allRobotCars[i].querySelector(".timer").innerText;
    let timerSplit = timer.split(":");
    let seconds = (timerSplit[0]*60) + timerSplit[1];

    timerList.push([{
      timer: timer,
      seconds: seconds,
      robotCarIp: allRobotCars[i].id
    }]);
  }

  timerList.sort((a, b) => {
    return parseInt(a[0].seconds) - parseInt(b[0].seconds);
  })

  for(let i = 0; i < allRobotCars.length; i++) {
    let robotcarIp = timerList[i][0].robotCarIp;
    const robotCarElement = document.getElementById(robotcarIp);
    robotCarElement.querySelector(".position").innerText = i+1;
    parent.appendChild(robotCarElement);
  }
}

function startCarByIp(ip) {
  let module = document.getElementById("modulePicker").value;
  let carIp = "http://" + ip + "/startRobot";
  console.log(carIp);
  try {
    fetch(carIp, {
      method: "POST",
      mode: "no-cors",
      body: JSON.stringify({
        module: module
      }),
      headers: {
        "Content-Type": "application/json"
      }
    })
  }
  catch (e) {
    console.error("Couldn't start car:", e);
  }
}


function loadRobotCars() {
  for (const i in robotCarsData) {
    let robotCar = robotCarsData[i];
    if(robotCar.ip != null && robotCar['Arduino'].ip != null) {
      carsTimer.push({
        ip: robotCar['Arduino'].ip,
        active: false,
        interval: null
      });
      let card = `
          <div id="` + robotCar['Arduino'].ip + `" class="robotCar mx-2 col card">
            <div class="card-body">
              <div class="row">
                <div class="position card-title"></div>
              </div>
              <div class="row form-check">
                <div class="col">
                  <label class="form-check-label">Selecteer robotauto</label>
                  <input class="form-check-input selectRobotCar" data-robot_ip="` + robotCar['Arduino'].ip + `" type="checkbox"></input>
                </div>
              </div>
              <div class="row">
                  <div class="col">
                    <h5 class="card-title robotName">` + (robotCar.customName != undefined ? robotCar.customName : robotCar.ip) + `</h5>
                    <a class="btn col" onclick="editCustomName(` + i + `, '` + robotCar['Arduino'].ip + `')">
                      <i class="bi bi-pencil-square"></i>
                    </a>
                  </div>
                  <div id="timer_` + robotCar['Arduino'].ip + `" class="timer">
                    00:00
                  </div>
                  <div id="bestTime_` + robotCar['Arduino'].ip + `">
                    Beste tijd: ` + ((robotCar.bestTime != undefined) ? robotCar.bestTime : "-") + `
                  </div>
                  <div id="lastTime_` + robotCar['Arduino'].ip + `">
                    Laatste tijd: -
                  </div>
              </div>
              <img src="` + robotCar.camera_feed + `" class="card-img-top" onerror="loadFallbackImg(this)></img>
              <div class="row">
                <div class="col">
                  <a onclick="stopCar('` + i + `', '` + robotCar['Arduino'].ip + `')" class="btn btn-danger">Stop robotauto</a>
                </div>
              </div>
            </div>
          </div>
      `;
      parent.innerHTML += card;
      currentRobots.push(i);
    }
  }
}

function loadFallbackImg(self) {
  self.src = "";
}

function deleteRobotCars() {
  Swal.fire({
      title: "Weet je zeker dat je alle robotauto's wilt verwijderen?",
      icon: "question",
      iconHtml: "!",
      confirmButtonText: "Verwijder",
      cancelButtonText: "Annuleer",
      showCancelButton: true,
      showCloseButton: true,
      preConfirm: () => {
        try {
          fetch("/deleteAllData", {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            }
          });
          Swal.fire({
            icon: "success",
            title: "Robotauto's zijn verwijderd!"
          });
        }
        catch (e) {
          Swal.fire({
            icon: "warning",
            title: "Er is iets foutgegaan!"
          });
          console.log(e);
        }
      }
  });
}