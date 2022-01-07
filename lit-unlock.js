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
// Generate a snippet
// @param { String } readable of access control conditions
// @param { String } data
// @returns { String } snippet
//
const getSnippet = (readable, data) => {
  return `
  <div class="lit-video-wrapper">
    <iframe 
        src=""
        class="lit-video"
        allow="accelerometer; gyroscope; 
        autoplay; encrypted-media; 
        picture-in-picture;" 
        allowfullscreen="true"
        data-server="${btoa(window.location.origin)}"
        data-readable-conditions="${readable}"
        data-lit="${data}">
    </iframe>
    <button class="btn-lit-video-unlock">🔥  Unlock with Lit-Protocol</button>
</div>

<script onload="LitJsSdk.litJsSdkLoadedInALIT()" src="https://jscdn.litgateway.com/index.web.js"></script>
<script src="https://cloudflare-unlock-sdk-js-cdn.litgateway.com/0.0.1/lit-unlock.min.js"></script>
<link rel="stylesheet" href="https://cloudflare-unlock-sdk-js-cdn.litgateway.com/0.0.1/lit-unlock.min.css"></link>

`;
};

const liveIcon = `<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5.636 18.364a9 9 0 010-12.728m12.728 0a9 9 0 010 12.728m-9.9-2.829a5 5 0 010-7.07m7.072 0a5 5 0 010 7.07M13 12a1 1 0 11-2 0 1 1 0 012 0z" />
</svg>`;

//
// Get video id
// @param { HTMLElmenet } e
// @returns { void }
//
async function onClickedUnlock(e) {
  // -- copy snippet
  const snippet = e.parentElement.querySelector('.lit-video-snippet').innerText;
  navigator.clipboard.writeText(snippet);

  // -- show copied message
  e.parentElement.querySelector('.lit-video-msg').classList.add('active');
  
  // -- prepare
  const data = JSON.parse(atob(e.getAttribute("data-lit")));
  const accessControlConditions = JSON.parse(atob(data["accessControlConditions"]));
  const resourceId = JSON.parse(atob(data["resourceId_base64"]));
  console.log(`🔓resourceId: ${JSON.stringify(resourceId)}`);
  const chain = accessControlConditions[0].chain;
  const authSig = await LitJsSdk.checkAndSignAuthMessage({ chain: chain });

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
// Manipulate the container the wraps around the UI component,
// and modify its HTML elements
// @param { HTMLElement } wrapper
// @returns { HTMLElement, HTMLElement } btn, wrapper
//
function manipulateWrapper(wrapper) {

  // -- helper
  const addTo = (parent, children) => children.map((child) => parent.appendChild(child));
  
  // -- getting data from the wrapper
  var iframe = wrapper.querySelector("iframe");
  var btn = wrapper.querySelector("button");
  var textReadable = iframe.getAttribute("data-readable-conditions");

  // -- setting up new elements
  var description = Object.assign(document.createElement("div"), {
    classList: 'lit-video-description'
  });

  var overlay = Object.assign(document.createElement("div"), {
    classList: 'lit-video-overlay',
  });

  var info = Object.assign(document.createElement('div'), {
    classList: 'lit-video-info',
    innerText: textReadable,
  });

  var snippetArea = Object.assign(document.createElement('pre'), {
    classList: 'lit-video-snippet',
    innerText: getSnippet(textReadable, iframe.getAttribute("data-lit")),
    style: 'opacity: 0',
  });

  var msg = Object.assign(document.createElement('div'), {
    classList: 'lit-video-msg',
    innerText: 'copied to Clipboard!',
  });

  // -- adding all to the wrapper div
  wrapper.insertBefore(msg, iframe);
  wrapper.insertBefore(overlay, iframe);
  addTo(overlay, [description]);
  addTo(wrapper, [snippetArea]);
  addTo(description, [btn, info]);

  // If this stream type is "live"
  if (
    JSON.parse(
      atob(JSON.parse(atob(iframe.getAttribute("data-lit"))).resourceId_base64)
    ).extraData == "live"
  ) {
    var divLive = document.createElement("div");
    divLive.classList.add("lit-video-live");
    divLive.innerHTML = liveIcon;
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
