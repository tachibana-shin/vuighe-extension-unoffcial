import { isVuiGhe } from "~/logic/isVuiGhe";

// only on dev mode
if (import.meta.hot) {
  // @ts-expect-error for background HMR
  import("/@vite/client");
  // load latest content script
  import("./contentScriptHMR");
}

function onLoadPage() {
  chrome.tabs.query(
    {
      active: true,
      currentWindow: true,
    },
    (tabs) => {
      const countTabsIsVuiGhe = tabs.reduce((prev, { url }) => {
        if (isVuiGhe(url)) return prev + 1;

        return prev;
      }, 0);

      if (countTabsIsVuiGhe > 0) {
        chrome.browserAction.setBadgeBackgroundColor({
          color: "#f44336",
        });
        chrome.browserAction.setBadgeText({
          text: countTabsIsVuiGhe + "",
        });
      } else {
        chrome.browserAction.setBadgeText({
          text: "",
        });
      }
    }
  );
}

chrome.storage.onChanged.addListener(() => {
  window.location.reload();
});

chrome.storage.sync.get("options", (data) => {
  const options = data.options || {};

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.id !== "inject-code") return sendResponse();

    let code = `console.log("%c 🛠💎Tiện ích VuiGhe-UnOffical đamg chạy", "font-size: 40px; color: rgb(52 211 153); text-align: center");`;

    if (options.active_VIP) {
      code += `Object.defineProperty(_GLOBAL, "_IS_VIP", {
    get() {
      return true;
    },
    set(val) {}
  })`;
    }
    if (options.keybinding_window) {
      code += `;(() => {
    window.addEventListener("keypress", event => {
     if (event.target !== document.body) return
     if (event.which === 13) {
       player.video.paused ? player.video.play() : player.video.pause();
       return
     }
     if (event.which === 102) {
       player.isFullscreen() ? player.exitFullscreen() : player.requestFullscreen();
       return 
     }
   })
   const keyActive = [32, 75, 37, 39, 40, 38, 77, 70, 13]
   
   function isController(which) {
     if (keyActive.includes(which)) return true;
     if (which >= 47 && which <= 59) return true;
     if (which >= 95 && which <= 106) return true;
     
     return false
   }
   
   window.addEventListener("keydown", event => {
     if (event.target !== document.body) return
     
     if (isController(event.which) === false) return 
     
     player.el_.onkeydown(event)
   })
  })()`;
    }

    if (options.quality_default && options.quality_default !== "auto") {
      code += `;(() => {
        const onPlayerReady = () => {
          if (typeof player !== "object") return ;

          // cancel events;
          document.removeEventListener("DOMContentLoaded", onPlayerReady)
  window.removeEventListener("load", onPlayerReady)
          if (window.onload === onPlayerReady) window.onload = null;
          if (document.body.onload === onPlayerReady) document.body.onload = null;

   const a =  player.playVideoFromEpisode 
   player.playVideoFromEpisode = (...args) => {
     console.log(args);
     return a.apply(player, args)
   }
   
   const b = player.createQualityItem
   player.createQualityItem = (...args) => {
     const r = b.apply(player, args)
     
     if (args[0].quality === "${options.quality_default}") {
       console.log("720p");
       setTimeout(function() {
         document.querySelector(".quality-${options.quality_default}")?.click()
         console.log(document.querySelector(".quality-${options.quality_default}"));
       }, 72);
     }
     
     return r
   }
}


if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", onPlayerReady)
  window.addEventListener("load", onPlayerReady)
  window.onload = onPlayerReady
  document.body.onload = onPlayerReady
} else {
  onPlayerReady()
}
  })()`;
    }
    if (options.remind_pause) {
      code += `;(() => {
            const eventsIneraction = ["click", "keydown", "scroll", "mouseenter", "mousemove", "touchstart"]

        const onReady = () => {
          if (typeof player !== "object") return ;

          // cancel events;
          document.removeEventListener("DOMContentLoaded", onReady)
          window.removeEventListener("load", onReady)

          let timeout;
          function startTimeoutAutoPause() {
            stopTimeoutAutoPause()
            timeout = setTimeout(() => {
              stopTimeoutAutoPause()

              alert("Anime tạm dừng do 1h15p qua không có tương tác")
              console.log("Dừng do 1h15p qua không có tương tác")

              player.video.pause()
            }, (1 * 60 + 15) * 60 * 1e3)

            eventsIneraction.forEach(name => {
              window.addEventListener(name, startTimeoutAutoPause)
            })
          }
          function stopTimeoutAutoPause() {
            if (timeout) clearTimeout(timeout)
            timeout = null
            eventsIneraction.forEach(name => {
              window.removeEventListener(name, startTimeoutAutoPause);
            })
          }

          if (player.video.paused === false) startTimeoutAutoPause()
          player.video.addEventListener("play", startTimeoutAutoPause)
          player.video.addEventListener("pause", stopTimeoutAutoPause)
        }

        if (document.readyState === "loading") {
          document.addEventListener("DOMContentLoaded", onReady)
          window.addEventListener("load", onReady)
        } else {
          onReady()
        }
      })()`
    }
    code += ";";

    chrome.tabs.executeScript(
      sender.tab.id,
      {
        code: `const script = document.createElement("script");
script.innerHTML = ${JSON.stringify(code)};
(document.head||document.documentElement).prepend(script);
 script.remove()`,
      },
      () => {}
    );

    sendResponse();
  });
});
chrome.tabs.onUpdated.addListener(onLoadPage);
chrome.tabs.onActivated.addListener(onLoadPage);