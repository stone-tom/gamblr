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

let defferredPrompt;

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

if ("serviceWorker" in navigator) {
  console.log("we support SW");
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").then((reg) => {
      listenForWaitingServiceWorker(reg, showUpdateButton);
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
    const games = await fetch('http://localhost:1337/games');
    // const games = await fetch('https://gamblr-api.herokuapp.com/games');
    // console.log(games.json());
    return games.json();
  } catch (e) {
    console.log(e);
  }
}

const renderHTML = (id, content) => {
  const domElement = document.getElementById(id);
  domElement.innerHTML += content;
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


deleteGameButton.addEventListener('click', () => {
  console.log('delete game')
  localStorage.removeItem('currentGame');
  newGame.style.display = 'none';
  createGame.style.display = 'inline';
  players.innerHTML = '';
});

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
  console.log(names);
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
        <button id="${newPlayer.value}_add">+</button>
      </td>
      <td>
        <button id="${newPlayer.value}_remove">-</button>
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
  console.log(names);
  if (names.length >= 3) {
    addPlayerForm.style.display = 'none';
  }
};

startGameButton.addEventListener('click', startGame);

players.addEventListener('click', (e) => {
  if (e.target.tagName === 'BUTTON') {
    const idArray = e.target.id.split('_');
    const [name, type] = idArray;
    console.log(name, type);
    const valueContainer = document.getElementById(`${name}_points`);
    const currentValue = parseInt(valueContainer.innerHTML, 10);
    // when adding, set localStorage, check "kick out" score is reached, trigger alert message, enable Submit Button.
    if (type === 'add') {
      currentValue < 3 ? valueContainer.innerHTML = currentValue + 1 : valueContainer.innerHTML = currentValue;
      localStorage.setItem('currentGame', JSON.stringify(getCurrentGameStatus()));
      if (currentValue + 1 === 3) {
        alert(`${name} got kicked out!`);
        submitButton.disabled = false;
        console.log(getCurrentGameStatus())
      }
      //when removing, set LocalStorage, check if there is one, that has 3 points
    } else if (type === 'remove') {
      currentValue > 1 ? valueContainer.innerHTML = currentValue - 1 : valueContainer.innerHTML = 0;
      localStorage.setItem('currentGame', JSON.stringify(getCurrentGameStatus()));
      const currentGameStats = getCurrentGameStatus();
      if (Object.entries(currentGameStats).some(([name, points]) => points < 3)) {
        submitButton.disabled = true;
      }
    }
  }
});

const submitGame = async () => {
  try {
    const results = getCurrentGameStatus();
    console.log(results);
    console.log(JSON.stringify({
      results,
    }));
    const response = await fetch('http://localhost:1337/games', {
      method: 'POST',
      body: JSON.stringify({
        results,
      }),
      headers: {
        'Content-Type': 'application/json'
      },
    })
    console.log(response);
  } catch (e) {
    console.log('ERROR');
    error.innerHTML = 'Du bist gerade nicht online, sende das Spiel wieder,wenn du online bist';
  }
};

submitButton.addEventListener('click', submitGame);

window.addEventListener('load', () => {
  renderGames();
  const runningGame = JSON.parse(localStorage.getItem('currentGame'));
  if (runningGame) {
    // show games and remove create button
    newGame.style.display = 'inline';
    createGame.style.display = 'none';
    for (const [name, points] of Object.entries(runningGame)) {
      console.log(points);
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
