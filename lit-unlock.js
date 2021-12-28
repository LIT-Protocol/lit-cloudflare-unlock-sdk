// ----- helper
//
// convert data URI to blob
// @param { String } dataURI
// @return { Blob } blob object
//
function dataURItoBlob(dataURI) {
    var byteString = atob(dataURI.split(',')[1]);
    var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0]
    var ab = new ArrayBuffer(byteString.length);
    var ia = new Uint8Array(ab);
    for (var i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
    }
    var blob = new Blob([ab], {type: mimeString});
    return blob;
}

// 
// Turn Uint8Array to Hex
// @param { String } buffer
// @returns { String } 0x...
//
buf2hex = (buffer) => [...new Uint8Array(buffer)]
        .map((x) => x.toString(16).padStart(2, "0"))
        .join("");

// ----- unlock

//
// (Deprecated) Decrypt videoId
// @param { HTMLElement } element
// @returns { void }
// 
async function onClickedUnlock(e){
    var data = JSON.parse(atob(e.getAttribute('data-lit')));

    const accessControlConditions = JSON.parse(atob(data['accessControlConditions']));
    const encryptedZip = dataURItoBlob(data['encryptedZip']);
    const toDecrypt = buf2hex(new Uint8Array(atob(data['encryptedSymmetricKey']).split(',').map((x) => parseInt(x))));
    const chain = accessControlConditions[0].chain;
    const authSig = await LitJsSdk.checkAndSignAuthMessage({chain: chain});
    
    const decryptedSymmetricKey = await window.litNodeClient.getEncryptionKey({
        accessControlConditions,
        toDecrypt,
        chain,
        authSig
    });

    const decryptedFiles = await LitJsSdk.decryptZip(encryptedZip, decryptedSymmetricKey);
    const decryptedString = await decryptedFiles["string.txt"].async("text"); // video id

    if(decryptedString != null & decryptedString != ''){
        console.log("Unlocked");
        const url = `https://iframe.videodelivery.net/${decryptedString}`;
        e.src = url;
        e.parentElement.classList.add('active');
    }
}

// 
// Get video id
// @param { HTMLElmenet } e
// @returns { void } 
//
async function onClickedUnlockJWT(e){

    const data = JSON.parse(atob(e.getAttribute('data-lit')));
    const accessControlConditions = JSON.parse(atob(data['accessControlConditions']));
    
    const resourceId = JSON.parse(atob(data['resourceId_base64']));
    console.log(resourceId);
    const chain = accessControlConditions[0].chain;
    const authSig = await LitJsSdk.checkAndSignAuthMessage({chain: chain});

    // -- prepare
    const jwt = await litNodeClient.getSignedToken({ accessControlConditions, chain, authSig, resourceId });
    const url = `http://127.0.0.1:8787/api/video_id?jwt=${jwt}`;
    console.warn(url);

    // -- execute
    const res = await fetch(url);
    const token = await res.json();
    
    e.src = `https://iframe.videodelivery.net/${token}`;
    e.parentElement.classList.add('active');

}

// 
// Manipulate elements and create a new wrapper
// @param { HTMLElement } wrapper
// @returns { HTMLElement, HTMLElement } btn, wrapper
//
function manipulateWrapper(wrapper){
    var iframe = wrapper.querySelector('iframe');
    var btn = wrapper.querySelector('button');
    var text = iframe.getAttribute('data-readable-conditions');
    var description = document.createElement('div');
    description.classList.add('lit-video-description');
    var overlay = document.createElement('div');
    overlay.classList.add('lit-video-overlay');

    var info = document.createElement('span');
    info.classList.add('lit-video-info');
    info.innerText = text;
    wrapper.insertBefore(overlay, iframe);
    wrapper.appendChild(description);
    description.appendChild(btn);
    description.appendChild(info);

    return {btn, wrapper, iframe};
}


// mounted
(() => {
    [...document.getElementsByClassName('lit-video-wrapper')].forEach((_wrapper) => {
        
        const {btn, wrapper, iframe} = manipulateWrapper(_wrapper);
        
        [btn, wrapper].forEach((e) => e.addEventListener('click', () => onClickedUnlockJWT(iframe)));

    });
})();