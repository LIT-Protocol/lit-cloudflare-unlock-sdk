// ----- helper
//
// convert data URI to blob
// @param { String } dataURI
// @return { Blob } blob object
//
function dataURItoBlob(dataURI) {
  var byteString = atob(dataURI.split(",")[1]);
  var mimeString = dataURI.split(",")[0].split(":")[1].split(";")[0];
  var ab = new ArrayBuffer(byteString.length);
  var ia = new Uint8Array(ab);
  for (var i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  var blob = new Blob([ab], { type: mimeString });
  return blob;
}

//
// Turn Uint8Array to Hex
// @param { String } buffer
// @returns { String } 0x...
//
buf2hex = (buffer) =>
  [...new Uint8Array(buffer)]
    .map((x) => x.toString(16).padStart(2, "0"))
    .join("");

//
// Get video id
// @param { HTMLElmenet } e
// @returns { void }
//
async function onClickedUnlock(e) {
  const data = JSON.parse(atob(e.getAttribute("data-lit")));
  const accessControlConditions = JSON.parse(
    atob(data["accessControlConditions"])
  );

  const resourceId = JSON.parse(atob(data["resourceId_base64"]));
  console.log(`🔓resourceId: ${JSON.stringify(resourceId)}`);
  const chain = accessControlConditions[0].chain;
  const authSig = await LitJsSdk.checkAndSignAuthMessage({ chain: chain });

  // -- prepare
  // const lit_id = document.getElementById('lit-server');
  // const server = lit_id.getAttribute('src').split('?server=')[1];
  const server = atob(e.getAttribute("data-server"));
  console.log(`🔓 SERVER: ${server}`);
  const jwt = await litNodeClient.getSignedToken({
    accessControlConditions,
    chain,
    authSig,
    resourceId,
  });
  const url = `${server}/api/video_id?jwt=${jwt}`;
  console.warn(url);

  // -- execute
  const res = await fetch(url);
  const token = await res.json();

  e.src = `https://iframe.videodelivery.net/${token}`;
  e.parentElement.classList.add("active");
}

//
// Manipulate elements and create a new wrapper
// @param { HTMLElement } wrapper
// @returns { HTMLElement, HTMLElement } btn, wrapper
//
function manipulateWrapper(wrapper) {
  var iframe = wrapper.querySelector("iframe");
  var btn = wrapper.querySelector("button");
  var text = iframe.getAttribute("data-readable-conditions");
  var description = document.createElement("div");
  description.classList.add("lit-video-description");
  var overlay = document.createElement("div");
  overlay.classList.add("lit-video-overlay");

  var info = document.createElement("span");
  info.classList.add("lit-video-info");
  info.innerText = text;
  wrapper.insertBefore(overlay, iframe);
  wrapper.appendChild(description);
  description.appendChild(btn);
  description.appendChild(info);

  // If this stream type is live
  if (
    JSON.parse(
      atob(JSON.parse(atob(iframe.getAttribute("data-lit"))).resourceId_base64)
    ).extraData == "live"
  ) {
    var divLive = document.createElement("div");
    divLive.classList.add("lit-video-live");
    divLive.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5.636 18.364a9 9 0 010-12.728m12.728 0a9 9 0 010 12.728m-9.9-2.829a5 5 0 010-7.07m7.072 0a5 5 0 010 7.07M13 12a1 1 0 11-2 0 1 1 0 012 0z" />
        </svg>
        `;
    wrapper.appendChild(divLive);
  }

  return { btn, wrapper, iframe };
}

// mounted
(() => {
  [...document.getElementsByClassName("lit-video-wrapper")].forEach(
    (_wrapper) => {
      const { btn, wrapper, iframe } = manipulateWrapper(_wrapper);

      [btn, wrapper].forEach((e) =>
        e.addEventListener("click", () => onClickedUnlock(iframe))
      );
    }
  );
})();
