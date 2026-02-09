let radarData = [];
let fixedColors = ['#1DD1A1', '#FFA502', '#54A0FF', '#FD79A8'];
let quadrantNames = ['Languages', 'Frameworks', 'Infrastructure', 'Data & AI'];
let ringLabels = ['Adopt', 'Trial', 'Assess', 'Hold'];
let listItemMap = {};
let currentHighlightedLi = null;

function drawQuadrant(canvasId, quadrantIndex) {
    const canvas = document.getElementById(canvasId);
    const ctx = canvas.getContext('2d');
    
    const dpr = window.devicePixelRatio || 1;
    const size = Math.min(window.innerWidth * 0.35, 350);
    
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = size + 'px';
    canvas.style.height = size + 'px';
    
    ctx.scale(dpr, dpr);
    
    const maxRadius = size - 5;
    const ringRadii = [
        maxRadius * 0.25,
        maxRadius * 0.50,
        maxRadius * 0.75,
        maxRadius
    ];
    
    const ringColors = fixedColors;
    const strokeWidth = 2;
    
    let startAngle, endAngle, centerX, centerY, labelX, labelY;
    
    if (quadrantIndex === 0) {
        startAngle = Math.PI;
        endAngle = Math.PI * 1.5;
        centerX = size - 2;
        centerY = size - 2;
        labelX = size * 0.2;
        labelY = size * 0.2;
    } else if (quadrantIndex === 1) {
        startAngle = Math.PI * 1.5;
        endAngle = Math.PI * 2;
        centerX = 2;
        centerY = size - 2;
        labelX = size * 0.8;
        labelY = size * 0.2;
    } else if (quadrantIndex === 2) {
        startAngle = Math.PI * 0.5;
        endAngle = Math.PI;
        centerX = size - 2;
        centerY = 2;
        labelX = size * 0.2;
        labelY = size * 0.8;
    } else {
        startAngle = 0;
        endAngle = Math.PI * 0.5;
        centerX = 2;
        centerY = 2;
        labelX = size * 0.8;
        labelY = size * 0.8;
    }
    
    const quadrantData = radarData.filter(item => item.quadrant === quadrantIndex);
    const dots = [];
    
    quadrantData.forEach(item => {
        const seedValue = item.id * 123.456;
        const pseudoRandom1 = (Math.sin(seedValue) + 1) / 2;
        const pseudoRandom2 = (Math.sin(seedValue * 1.618) + 1) / 2;
        
        const angleRange = endAngle - startAngle;
        const angle = startAngle + (pseudoRandom1 * angleRange * 0.8) + (angleRange * 0.1);
        
        const minRadius = item.ring === 0 ? 15 : ringRadii[item.ring - 1] + 15;
        const maxRadiusForRing = ringRadii[item.ring] - 15;
        const radius = minRadius + (maxRadiusForRing - minRadius) * (0.2 + pseudoRandom2 * 0.6);
        
        const x = centerX + radius * Math.cos(angle);
        const y = centerY + radius * Math.sin(angle);
        
        dots.push({ id: item.id, name: item.name, x, y });
    });
    
    const redraw = (highlightId = null) => {
        ctx.clearRect(0, 0, size * dpr, size * dpr);
        
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        const lineColor = isDark ? '#FFF' : '#000';
        const dotFill = isDark ? '#FFF' : '#000';
        const dotText = isDark ? '#000' : '#FFF';
        
        ctx.strokeStyle = lineColor;
        ctx.lineWidth = strokeWidth;
        
        for (let i = ringRadii.length - 1; i >= 0; i--) {
            ctx.beginPath();
            ctx.arc(centerX, centerY, ringRadii[i], startAngle, endAngle);
            ctx.lineTo(centerX, centerY);
            ctx.closePath();
            ctx.fillStyle = ringColors[i];
            ctx.fill();
            ctx.stroke();
        }
        
        const labelShadowColor = isDark ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.7)';
        
        ctx.font = 'bold 13px "Courier New"';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = labelShadowColor;
        ctx.fillText(quadrantNames[quadrantIndex], labelX + 1, labelY + 1);
        ctx.fillStyle = lineColor;
        ctx.fillText(quadrantNames[quadrantIndex], labelX, labelY);
        
        const midAngle = (startAngle + endAngle) / 2;
        
        for (let i = 0; i < ringRadii.length; i++) {
            const labelRadius = i === 0 
                ? ringRadii[i] * 0.6 
                : (ringRadii[i] + ringRadii[i-1]) / 2;
            const labelPosX = centerX + labelRadius * Math.cos(midAngle);
            const labelPosY = centerY + labelRadius * Math.sin(midAngle);
            
            ctx.font = 'bold 11px "Courier New"';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = labelShadowColor;
            ctx.fillText(ringLabels[i], labelPosX + 1, labelPosY + 1);
            ctx.fillStyle = lineColor;
            ctx.fillText(ringLabels[i], labelPosX, labelPosY);
        }
        
        dots.forEach(dot => {
            const isHighlighted = highlightId === dot.id;
            const r = isHighlighted ? 12 : 8;
            
            ctx.beginPath();
            ctx.arc(dot.x, dot.y, r, 0, Math.PI * 2);
            ctx.fillStyle = isHighlighted ? '#FFE66D' : dotFill;
            ctx.fill();
            ctx.strokeStyle = isDark ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.4)';
            ctx.lineWidth = 2;
            ctx.stroke();
            
            if (isHighlighted) {
                ctx.strokeStyle = lineColor;
                ctx.lineWidth = 3;
                ctx.stroke();
            }
            
            ctx.fillStyle = isHighlighted ? lineColor : dotText;
            ctx.font = isHighlighted ? 'bold 12px "Courier New"' : 'bold 10px "Courier New"';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(dot.id, dot.x, dot.y);
        });
    };
    
    window[`redrawQuadrant${quadrantIndex}`] = redraw;
    redraw();
    
    canvas.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        let hoveredDot = null;
        for (const dot of dots) {
            const distance = Math.sqrt(Math.pow(mouseX - dot.x, 2) + Math.pow(mouseY - dot.y, 2));
            if (distance < 12) {
                hoveredDot = dot;
                break;
            }
        }
        
        if (hoveredDot) {
            canvas.style.cursor = 'pointer';
            redraw(hoveredDot.id);
            highlightListItemById(hoveredDot.id);
        } else {
            canvas.style.cursor = 'default';
            redraw();
            clearAllListHighlights();
        }
    });
    
    canvas.addEventListener('mouseleave', () => {
        canvas.style.cursor = 'default';
        redraw();
        clearAllListHighlights();
    });
}

function createListItem(item) {
    const li = document.createElement('li');
    li.dataset.itemId = item.id;
    li.dataset.quadrant = item.quadrant;
    li.style.display = 'flex';
    li.style.alignItems = 'center';
    li.style.gap = '0.5rem';

    const dot = document.createElement('span');
    dot.style.display = 'inline-block';
    dot.style.width = '10px';
    dot.style.height = '10px';
    dot.style.borderRadius = '50%';
    dot.style.backgroundColor = fixedColors[item.ring];
    dot.style.flexShrink = '0';
    dot.title = ringLabels[item.ring];

    const text = document.createElement('span');
    text.textContent = `${item.id}. ${item.name}`;

    li.appendChild(dot);
    li.appendChild(text);

    li.addEventListener('mouseenter', () => {
        const redrawFunc = window[`redrawQuadrant${item.quadrant}`];
        if (redrawFunc) redrawFunc(item.id);
        li.style.backgroundColor = '#FFE66D';
        li.style.color = '#000';
    });

    li.addEventListener('mouseleave', () => {
        const redrawFunc = window[`redrawQuadrant${item.quadrant}`];
        if (redrawFunc) redrawFunc();
        li.style.backgroundColor = '';
        li.style.color = '';
    });

    return li;
}

function buildRadarLists() {
    const leftListsContainer = document.querySelector('.radar-lists-left');
    const rightListsContainer = document.querySelector('.radar-lists-right');
    if (!leftListsContainer || !rightListsContainer) return;

    const groupedData = radarData.reduce((acc, item) => {
        if (!acc[item.quadrant]) acc[item.quadrant] = [];
        acc[item.quadrant].push(item);
        return acc;
    }, []);

    [0, 2].forEach(qi => {
        const items = groupedData[qi];
        if (!items) return;
        const listDiv = document.createElement('div');
        listDiv.className = 'item-list';
        const title = document.createElement('h3');
        title.textContent = quadrantNames[qi];
        listDiv.appendChild(title);
        const ul = document.createElement('ul');
        items.forEach(item => ul.appendChild(createListItem(item)));
        listDiv.appendChild(ul);
        leftListsContainer.appendChild(listDiv);
    });

    [1, 3].forEach(qi => {
        const items = groupedData[qi];
        if (!items) return;
        const listDiv = document.createElement('div');
        listDiv.className = 'item-list';
        const title = document.createElement('h3');
        title.textContent = quadrantNames[qi];
        listDiv.appendChild(title);
        const ul = document.createElement('ul');
        items.forEach(item => ul.appendChild(createListItem(item)));
        listDiv.appendChild(ul);
        rightListsContainer.appendChild(listDiv);
    });

    listItemMap = {};
    document.querySelectorAll('li[data-item-id]').forEach(li => {
        listItemMap[li.dataset.itemId] = li;
    });
}

function highlightListItemById(itemId) {
    clearAllListHighlights();
    const li = listItemMap[itemId];
    if (li) {
        li.style.backgroundColor = '#FFE66D';
        li.style.color = '#000';
        currentHighlightedLi = li;
    }
}

function clearAllListHighlights() {
    if (currentHighlightedLi) {
        currentHighlightedLi.style.backgroundColor = '';
        currentHighlightedLi.style.color = '';
        currentHighlightedLi = null;
    }
}

async function initRadar() {
    try {
        const response = await fetch('data/radar.json');
        if (!response.ok) throw new Error('Failed to load radar.json');
        const config = await response.json();
        
        radarData = config.items;
        quadrantNames = config.quadrants;
        ringLabels = config.rings;
        fixedColors = config.colors;
    } catch (e) {
        console.error('Could not load radar config:', e);
        return;
    }

    drawQuadrant('quadrant0', 0);
    drawQuadrant('quadrant1', 1);
    drawQuadrant('quadrant2', 2);
    drawQuadrant('quadrant3', 3);
    
    buildRadarLists();
}

document.addEventListener('DOMContentLoaded', () => {
    initRadar();
});

let resizeTimeout;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        if (radarData.length > 0) {
            drawQuadrant('quadrant0', 0);
            drawQuadrant('quadrant1', 1);
            drawQuadrant('quadrant2', 2);
            drawQuadrant('quadrant3', 3);
        }
    }, 200);
});

const themeObserver = new MutationObserver(() => {
    if (radarData.length > 0) {
        drawQuadrant('quadrant0', 0);
        drawQuadrant('quadrant1', 1);
        drawQuadrant('quadrant2', 2);
        drawQuadrant('quadrant3', 3);
    }
});
themeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme']
});
