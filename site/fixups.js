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

    // fleurons to indent subheadings
    for (let i of [4, 5, 6]) {
        let hTags = document.getElementsByTagName(`h${i}`);
        for (let tag of hTags) {
            tag.textContent = '➻ ' + tag.textContent;
        }
    }

    let linksUsed = {};
    function makeLinkAnchor(tag) {
        let link = tag.textContent.toLowerCase()
            .replaceAll(/[^a-z\d]/g, '-')
            .replaceAll(/-+/g, '-')
            .replaceAll(/^-|-$/g, '');
        while (linksUsed[link]) link += '-dup';
        linksUsed[link] = 1;
        return link;
    }

    // make all headings bookmark-able
    for (let i of [2, 3, 4, 5, 6]) {
        let hTags = document.getElementsByTagName(`h${i}`);
        for (let tag of hTags) {
            const hoverTag = document.createElement('span');
            hoverTag.classList.add('heading-link-hover');
            const aTag = document.createElement('a');
            aTag.innerHTML = '❡';
            aTag.classList.add('heading-link');
            const link = makeLinkAnchor(tag);
            aTag.href = `#${link}`;
            tag.id = link;
            tag.style.position = 'relative';
            tag.classList.add('heading');
            hoverTag.appendChild(aTag);
            tag.appendChild(hoverTag);
        }
    }
})();
