const runBtn = document.getElementById('runBtn');
const statusDot = document.getElementById('statusDot');
const statusText = document.getElementById('statusText');

const cpuValue = document.getElementById('cpuValue');
const cpuBar = document.getElementById('cpuBar');
const gpuValue = document.getElementById('gpuValue');
const gpuBar = document.getElementById('gpuBar');
const bwValue = document.getElementById('bwValue');
const bwBar = document.getElementById('bwBar');

const providerBalance = document.getElementById('providerBalance');
const consumerBalance = document.getElementById('consumerBalance');
const feedContainer = document.getElementById('feedContainer');

let animationInterval;

function logMessage(msg, type = 'system') {
  const div = document.createElement('div');
  div.className = `feed-item ${type}`;
  const time = new Date().toLocaleTimeString();
  div.textContent = `[${time}] ${msg}`;
  feedContainer.appendChild(div);
  feedContainer.scrollTop = feedContainer.scrollHeight;
}

function startFakeTelemetry() {
  animationInterval = setInterval(() => {
    const cpu = Math.random() * 100;
    const gpu = Math.random() * 100;
    const bw = Math.random() * 1000;
    
    cpuValue.textContent = `${cpu.toFixed(1)}%`;
    cpuBar.style.width = `${cpu}%`;
    
    gpuValue.textContent = `${gpu.toFixed(1)}%`;
    gpuBar.style.width = `${gpu}%`;
    
    bwValue.textContent = `${bw.toFixed(1)} Mbps`;
    bwBar.style.width = `${(bw/1000)*100}%`;
  }, 100);
}

function stopFakeTelemetry() {
  clearInterval(animationInterval);
  cpuValue.textContent = `0%`;
  cpuBar.style.width = `0%`;
  gpuValue.textContent = `0%`;
  gpuBar.style.width = `0%`;
  bwValue.textContent = `0 Mbps`;
  bwBar.style.width = `0%`;
}

function animateBalance(element, start, end) {
  const duration = 1000;
  const startTime = performance.now();
  
  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    
    // easeOutQuart
    const ease = 1 - Math.pow(1 - progress, 4);
    const current = start + (end - start) * ease;
    
    element.textContent = current.toFixed(4);
    
    if (progress < 1) {
      requestAnimationFrame(update);
    }
  }
  requestAnimationFrame(update);
}

runBtn.addEventListener('click', async () => {
  runBtn.disabled = true;
  statusDot.classList.add('active');
  statusText.textContent = 'RUNNING CYCLE...';
  
  logMessage('Initiating autonomous compute cycle...', 'system');
  logMessage('Scanning service registry for providers...', 'system');
  
  startFakeTelemetry();

  try {
    const response = await fetch('/api/run');
    const data = await response.json();
    
    stopFakeTelemetry();

    if (response.ok) {
      logMessage(`Optimal provider selected: ${data.marketplace.optimalProvider}`, 'success');
      logMessage(`Oracle calculated cost: ${data.billing[0].amount} UTKN`, 'success');
      logMessage(`P2P settlement executed between provider and consumer.`, 'success');
      
      const currentProvider = parseFloat(providerBalance.textContent);
      const currentConsumer = parseFloat(consumerBalance.textContent);
      
      animateBalance(providerBalance, currentProvider, data.ledger.provider);
      animateBalance(consumerBalance, currentConsumer, data.ledger.consumer);
      
    } else {
      logMessage(`Error: ${data.error || 'Unknown error'}`, 'error');
    }

  } catch (err) {
    stopFakeTelemetry();
    logMessage(`Network Error: ${err.message}`, 'error');
  } finally {
    runBtn.disabled = false;
    statusDot.classList.remove('active');
    statusText.textContent = 'SYSTEM IDLE';
  }
});
