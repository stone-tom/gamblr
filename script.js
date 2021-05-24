const butInstall = document.getElementById("butInstall");
const butSend = document.getElementById("butSend");
const gamesContainer = document.getElementById("games");

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
    const games = await fetch('https://gamblr-api.heroku.app/games');
    return games.json();
  } catch (e) {
    console.log(e);
  }
}

const allGames = getGames().then((res) => {
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


