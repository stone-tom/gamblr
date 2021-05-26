const butInstall = document.getElementById("butInstall");
const butSend = document.getElementById("butSend");
const gamesContainer = document.getElementById("games");
const createGame = document.getElementById('create_new_game');
const newGame = document.getElementById('new_game');
const addPlayer = document.getElementById('add_player_button');
const newPlayer = document.getElementById('new_player');
const players = document.getElementById('players');
const submitButton = document.getElementById('submit_game');
const addPlayerForm = document.getElementById('add_player_form');
const deleteGameButton = document.getElementById('delete_game');
const startGameButton = document.getElementById('start_game');
const error = document.getElementById('error_field');
const pushButton = document.getElementById('push_button');

let defferredPrompt;
let registration;
const BACKEND_URL = 'https://gamblr-api.herokuapp.com/games';
// const BACKEND_URL = 'http://localhost:1337/games';
const applicationServerPublicKey = 'BNxP8Q3onty2qnLvk1yPU24UKNmfIluF3UxYR1UTAHu8Km61MnOr_RdaqOe8lYmcN6fo56cH1rpjVRzuLOSrpEs';

function urlB64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

window.addEventListener("beforeinstallprompt", (e) => {
  console.log("Installation event fired");
  e.preventDefault();

  defferredPrompt = e;
  return false;
});

butInstall.addEventListener("click", () => {
  if (defferredPrompt) {
    defferredPrompt.prompt();

    defferredPrompt.userChoice.then((res) => {
      if (res.outcome == "dismissed") {
        console.log("User canceled installation");
      } else {
        console.log("User installed app");
      }
    });
  }
});

butSend.addEventListener("click", () => {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.controller.postMessage('This Message shows on every open Tab of the APP');
  }
});

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.addEventListener("message", (event) => {
    console.log("Recaived message from sw:", event.data);
  });
}

const listenForWaitingServiceWorker = (reg, callback) => {
  function awaitStateChange() {
    reg.installing.addEventListener("statechange", function () {
      if (this.state === "installed") callback(reg);
    });
  }
  if (!reg) return;
  if (reg.waiting) return callback(reg);
  if (reg.installing) awaitStateChange();
  reg.addEventListener("updatefound", awaitStateChange);
};

const showUpdateButton = (reg) => {
  if (reg) {
    let button = document.querySelector("#update");
    button.addEventListener("click", () => {
      reg.waiting.postMessage("skipWaiting");
    });
    button.style.display = "inline";
  }
};

const updateButton = () => {
  if (Notification.permission === 'denied') {
    pushButton.innerHTML = 'Push Messaging Blocked.';
    pushButton.disabled = true;
    updateSubscriptionOnServer(null);
    return;
  }

  if (isSubscribed) {
    pushButton.innerHTML = 'Disable Push Messaging';
  } else {
    pushButton.innerHTML = 'Enable Push Messaging';
  }

  pushButton.disabled = false;
}

function updateSubscriptionOnServer(subscription) {
  const subscriptionJson = document.getElementById('sub_json');

  if (subscription) {
    subscriptionJson.innerHTML = JSON.stringify(subscription);
  } else {
    console.log('no subscription');
  }
}

function subscribeUser() {
  const applicationServerKey = urlB64ToUint8Array(applicationServerPublicKey);
  registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: applicationServerKey
  })
    .then(function (subscription) {
      console.log('User is subscribed.');

      updateSubscriptionOnServer(subscription);

      isSubscribed = true;

      updateButton();
    })
    .catch(function (err) {
      console.log('Failed to subscribe the user: ', err);
      updateButton();
    });
}

function unsubscribeUser() {
  registration.pushManager.getSubscription()
    .then(function (subscription) {
      if (subscription) {
        return subscription.unsubscribe();
      }
    })
    .catch(function (error) {
      console.log('Error unsubscribing', error);
    })
    .then(function () {
      updateSubscriptionOnServer(null);

      console.log('User is unsubscribed.');
      isSubscribed = false;

      updateButton();
    });
}

function initializeUI() {
  pushButton.addEventListener('click', function () {
    pushButton.disabled = true;
    if (isSubscribed) {
      unsubscribeUser();
    } else {
      subscribeUser();
    }
  });

  registration.pushManager.getSubscription()
    .then(function (subscription) {
      isSubscribed = !(subscription === null);

      if (isSubscribed) {
        console.log('User IS subscribed.');
      } else {
        console.log('User is NOT subscribed.');
      }
      updateButton();
    });
}

if ("serviceWorker" in navigator && 'PushManager' in window) {
  console.log("we support SW");
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").then((reg) => {
      registration = reg;
      listenForWaitingServiceWorker(reg, showUpdateButton);
      initializeUI();
      console.log('Service Worker registered')
    });
  });
}

let refreshing;
navigator.serviceWorker.addEventListener("controllerchange", () => {
  if (refreshing) return;
  refreshing = true;
  window.location.reload(true);
});

const getGames = async () => {
  try {
    const games = await fetch(BACKEND_URL);
    return games.json();
  } catch (e) {
    console.log(e);
  }
}

const renderHTML = (id, content) => {
  const domElement = document.getElementById(id);
  domElement.innerHTML += content;
}

removeHTML = (id) => {
  const elemToRemove = document.getElementById(id);
  if (elemToRemove.parentNode) {
    elemToRemove.parentNode.removeChild(elemToRemove);
  }
}

const renderGames = () => {
  getGames().then((res) => {
    const elements = res.map((element) => {
      const players = Object.entries(element.results).map(([key, value]) => (`
    <tr>
      <td>${key}</td>
      <td>${value}</td>
    </tr>
    `)).join('');

      return (`
      <table class="game">
        <thead>
          <tr>
            <th>Name:</th>
            <th>Punkte:</th>
          </tr>
      </thead>
        <tfoot>
        ${players}
        </tfoot>
      </table>`)
    });
    gamesContainer.innerHTML += elements.join(' ');
  });
};

createGame.addEventListener('click', () => {
  newGame.style.display = 'inline';
  createGame.style.display = 'none';
  addPlayerForm.style.display = 'inline';
});

const deleteGame = () => {
  localStorage.removeItem('currentGame');
  newGame.style.display = 'none';
  createGame.style.display = 'inline';
  players.innerHTML = '';
};

deleteGameButton.addEventListener('click', deleteGame);

const getCurrentPlayerNames = () => {
  const allPlayers = document.getElementById('players');
  const names = [];
  for (player of allPlayers.children) {
    const name = player.id.split('_')[0];
    names.push(name);
  }
  return names;
}

addPlayer.addEventListener('click', () => {
  const names = getCurrentPlayerNames();
  if (names.includes(newPlayer.value)) {
    alert('This name already exists! Chose another name.');
    return;
  }
  if ((names.length + 1) >= 3) {
    startGameButton.disabled = false;
  }
  renderHTML('players',
    `
    <tr id="${newPlayer.value}_container">
      <td id="${newPlayer.value}_name">${newPlayer.value}</td>
      <td id="${newPlayer.value}_points">0</td>
      <td>
        <button disabled id="${newPlayer.value}_add">+</button>
      </td>
      <td>
        <button disabled id="${newPlayer.value}_remove">-</button>
      </td>
      <td id="${newPlayer.value}_delete_container">
        <button disabled id="${newPlayer.value}_delete">delete</button>
      </td>
    </tr>
  `);
  newPlayer.value = '';
});

const getCurrentGameStatus = () => {
  const allPlayers = document.getElementById('players');
  const results = {};
  for (player of allPlayers.children) {
    const name = player.id.split('_')[0];
    const value = document.getElementById(`${name}_points`).innerHTML;
    results[name] = parseInt(value, 10);
  }
  return results;
}

const startGame = () => {
  const names = getCurrentPlayerNames();
  if (names.length >= 3) {
    addPlayerForm.style.display = 'none';
    startGameButton.disabled = true;
    localStorage.setItem('currentGame', JSON.stringify(getCurrentGameStatus()));

    for (const name of getCurrentPlayerNames()) {
      removeHTML(`${name}_delete_container`);
      document.getElementById(`${name}_add`).disabled = false;
      document.getElementById(`${name}_remove`).disabled = false;
    }
  }
};

startGameButton.addEventListener('click', startGame);

players.addEventListener('click', (e) => {
  if (e.target.tagName === 'BUTTON') {
    const idArray = e.target.id.split('_');
    const [name, type] = idArray;
    const valueContainer = document.getElementById(`${name}_points`);
    const currentValue = parseInt(valueContainer.innerHTML, 10);
    // when adding, set localStorage, check "kick out" score is reached, trigger alert message, enable Submit Button.
    if (type === 'add') {
      currentValue < 3 ? valueContainer.innerHTML = currentValue + 1 : valueContainer.innerHTML = currentValue;
      localStorage.setItem('currentGame', JSON.stringify(getCurrentGameStatus()));
      if (currentValue + 1 === 3) {
        alert(`${name} got kicked out!`);
        submitButton.disabled = false;
      }
      //when removing, set LocalStorage, check if there is one, that has 3 points
    } else if (type === 'remove') {
      currentValue > 1 ? valueContainer.innerHTML = currentValue - 1 : valueContainer.innerHTML = 0;
      localStorage.setItem('currentGame', JSON.stringify(getCurrentGameStatus()));
      const currentGameStats = getCurrentGameStatus();
      if (Object.entries(currentGameStats).some(([name, points]) => points < 3)) {
        submitButton.disabled = true;
      }
    } else if (type === 'delete') {
      removeHTML(`${name}_container`);
    }
  }
});

const submitGame = async () => {
  try {
    const results = getCurrentGameStatus();
    const response = await fetch(BACKEND_URL, {
      method: 'POST',
      body: JSON.stringify({
        results,
      }),
      headers: {
        'Content-Type': 'application/json'
      },
      //TODO add response to games
    }).then((response) => response.json());
    const players = Object.entries(response.results).map(([key, value]) => (`
    <tr>
      <td>${key}</td>
      <td>${value}</td>
    </tr>
    `)).join('');

    gamesContainer.innerHTML += (`
      <table class="game">
        <thead>
          <tr>
            <th>Name:</th>
            <th>Punkte:</th>
          </tr>
      </thead>
        <tfoot>
        ${players}
        </tfoot>
      </table>`);
    deleteGame();
  } catch (e) {
    error.innerHTML = 'You are currently offline! Submit the game when you are online again';
    setTimeout(() => {
      error.innerHTML = '';
    }, 3000)
  }
};

submitButton.addEventListener('click', submitGame);

window.addEventListener('load', () => {
  renderGames();
  const runningGame = JSON.parse(localStorage.getItem('currentGame'));
  if (runningGame) {
    if (Object.entries(runningGame).some(([name, points]) => points === 3)) {
      submitButton.disabled = false;
    }
    // show games and remove create button
    addPlayerForm.style.display = 'none';
    newGame.style.display = 'inline';
    createGame.style.display = 'none';
    for (const [name, points] of Object.entries(runningGame)) {
      if (points === '3') submitButton.disabled = false;
      renderHTML('players',
        `
        <tr id="${name}_container">
          <td id="${name}_name">${name}</td>
          <td id="${name}_points">${points}</td>
          <td>
            <button id="${name}_add">+</button>
          </td>
          <td>
            <button id="${name}_remove">-</button>
          </td>
        </tr>
      `);
    }
  }
});
