const butInstall = document.getElementById("butInstall");
const butSend = document.getElementById("butSend");
const gamesContainer = document.getElementById("games");
const createGame = document.getElementById('create_new_game');
const newGame = document.getElementById('new_game');
const addPlayer = document.getElementById('add_player_button');
const newPlayer = document.getElementById('new_player');
const players = document.getElementById('players');
const submitButton = document.getElementById('submit_game');

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
    navigator.serviceWorker.controller.postMessage({
      name: "Tarik",
      surname: "Huber",
    });
    console.log("Message send");
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
    // cache that one here
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
renderGames();


createGame.addEventListener('click', () => {
  newGame.style.display = 'inline';
});

addPlayer.addEventListener('click', () => {
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
});

players.addEventListener('click', (e) => {
  if (e.target.tagName === 'BUTTON') {
    const idArray = e.target.id.split('_');
    const [name, type] = idArray;
    console.log(name, type);
    const valueContainer = document.getElementById(`${name}_points`);
    const currentValue = parseInt(valueContainer.innerHTML, 10);
    if (type === 'add') {
      currentValue < 3 ? valueContainer.innerHTML = currentValue + 1 : valueContainer.innerHTML = currentValue;
    } else if (type === 'remove') {
      currentValue > 1 ? valueContainer.innerHTML = currentValue - 1 : valueContainer.innerHTML = 0;
    }
  }
});

const submitGame = () => {
  const allPlayers = document.getElementById('players');
  console.log(allPlayers.children);
  const results = {};
  for (player of allPlayers.children) {
    const name = player.id.split('_')[0];
    const value = document.getElementById(`${name}_points`).innerHTML;
    results[name] = value;
  }
  console.log('RES', results);
};

submitButton.addEventListener('click', () => {
  submitGame();
});

// window.addEventListener('load', () => {
//   renderGames();
// });
