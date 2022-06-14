(() => {
    // convenience tags
    let fs = document.getElementsByClassName('fat-fp');
    for (let f of fs) f.innerHTML = '<span>&#x1D53D;<sub>p</sub></span>';
    fs = document.getElementsByClassName('fat-fp-23');
    for (let f of fs) f.innerHTML = '<span>&#x1D53D;<sub>23</sub></span>';
    fs = document.getElementsByClassName('fat-fp-61');
    for (let f of fs) f.innerHTML = '<span>&#x1D53D;<sub>61</sub></span>';

    // truncated numbers
    const toKeep = 10;
    let nums = document.getElementsByClassName('collapse-num');
    for (let numTag of nums) {
        numTag.setAttribute('title', numTag.textContent);
        if (numTag.textContent.length > 2*toKeep) {
            numTag.textContent = numTag.textContent.slice(0, toKeep) + '…' + numTag.textContent.slice(-toKeep);
        }
    }
})();
