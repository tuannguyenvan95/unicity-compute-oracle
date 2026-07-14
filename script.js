// --- State & Mock Data ---
let currentProviderBalance = 0;
let currentConsumerBalance = 20;
let transactionCount = 0;

const mockProviders = [
    { id: 'node_operator_01', capacity: '128 Cores / 4x RTX 4090', price: '2.6 UTKN/hr', status: 'Online' },
    { id: 'node_operator_02', capacity: '64 Cores / 2x A100', price: '3.1 UTKN/hr', status: 'Online' },
    { id: 'node_operator_03', capacity: '32 Cores / 1x RTX 3090', price: '1.2 UTKN/hr', status: 'Busy' },
    { id: 'node_operator_04', capacity: '256 Cores / 8x H100', price: '15.0 UTKN/hr', status: 'Online' },
    { id: 'node_operator_05', capacity: '16 Cores / No GPU', price: '0.1 UTKN/hr', status: 'Offline' }
];

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    populateProviders();
    initChart();
});

// --- UI Elements ---
const runBtn = document.getElementById('runCycleBtn');
const deployBtn = document.getElementById('deployConsumerBtn');
const providerTableBody = document.getElementById('providerTableBody');
const ledgerTableBody = document.getElementById('ledgerTableBody');
const valProvider = document.getElementById('valProviderBalance');
const valConsumer = document.getElementById('valConsumerBalance');
const chartPulseOuter = document.getElementById('chartPulseOuter');
const chartStatusText = document.getElementById('chartStatusText');

// --- Populate Mock Providers ---
function populateProviders() {
    mockProviders.forEach(p => {
        let statusColor = p.status === 'Online' ? 'text-green-400' : (p.status === 'Busy' ? 'text-yellow-400' : 'text-red-400');
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td class="py-3 px-2 flex items-center">
                <i class="fa-solid fa-circle ${statusColor} text-[8px] mr-2"></i>
                <span class="text-white">${p.id}</span>
            </td>
            <td class="py-3 px-2 text-right text-gray-300 text-xs">${p.capacity}</td>
            <td class="py-3 px-2 text-right text-cyber-cyan">${p.price}</td>
        `;
        providerTableBody.appendChild(tr);
    });
}

// --- Chart.js Setup ---
let telemetryChart;
let chartInterval;
const MAX_DATA_POINTS = 20;

function initChart() {
    const ctx = document.getElementById('telemetryChart').getContext('2d');
    
    // Initial empty data
    const labels = Array(MAX_DATA_POINTS).fill('');
    const dataCpu = Array(MAX_DATA_POINTS).fill(10);
    const dataGpu = Array(MAX_DATA_POINTS).fill(5);
    const dataBw = Array(MAX_DATA_POINTS).fill(100);

    telemetryChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'CPU (%)',
                    borderColor: '#00F0FF',
                    backgroundColor: 'rgba(0, 240, 255, 0.1)',
                    borderWidth: 2,
                    tension: 0.4,
                    pointRadius: 0,
                    fill: true,
                    data: dataCpu
                },
                {
                    label: 'GPU (%)',
                    borderColor: '#B026FF',
                    backgroundColor: 'rgba(176, 38, 255, 0.1)',
                    borderWidth: 2,
                    tension: 0.4,
                    pointRadius: 0,
                    fill: true,
                    data: dataGpu
                },
                {
                    label: 'BW (Mbps/10)',
                    borderColor: '#FF3B00',
                    borderWidth: 2,
                    borderDash: [5, 5],
                    tension: 0.4,
                    pointRadius: 0,
                    fill: false,
                    data: dataBw
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: { duration: 0 },
            scales: {
                y: {
                    min: 0,
                    max: 100,
                    grid: { color: 'rgba(255, 255, 255, 0.05)' },
                    ticks: { color: '#888' }
                },
                x: {
                    grid: { display: false },
                    ticks: { display: false }
                }
            },
            plugins: {
                legend: {
                    labels: { color: '#E0E0E0', boxWidth: 12, font: { family: 'JetBrains Mono' } }
                }
            }
        }
    });

    // Start idle chart animation
    startChartSimulation(false);
}

function startChartSimulation(isHighLoad) {
    if (chartInterval) clearInterval(chartInterval);
    
    chartInterval = setInterval(() => {
        const datasets = telemetryChart.data.datasets;
        
        // Generate new point based on load
        let newCpu = isHighLoad ? 70 + Math.random() * 30 : 5 + Math.random() * 15;
        let newGpu = isHighLoad ? 80 + Math.random() * 20 : 2 + Math.random() * 10;
        let newBw = isHighLoad ? 40 + Math.random() * 50 : 10 + Math.random() * 10;

        datasets[0].data.push(newCpu);
        datasets[0].data.shift();
        datasets[1].data.push(newGpu);
        datasets[1].data.shift();
        datasets[2].data.push(newBw);
        datasets[2].data.shift();

        telemetryChart.update();
    }, isHighLoad ? 200 : 1000); // Faster updates under load
}

// --- Number Counter Animation ---
function animateValue(obj, start, end, duration) {
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        // easeOutExpo
        const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
        const current = start + (end - start) * ease;
        obj.innerHTML = current.toFixed(4) + ' UTKN';
        if (progress < 1) {
            window.requestAnimationFrame(step);
        }
    };
    window.requestAnimationFrame(step);
}

// --- Action: Deploy Consumer ---
deployBtn.addEventListener('click', () => {
    const btnIcon = deployBtn.querySelector('i');
    btnIcon.className = 'fa-solid fa-circle-notch fa-spin mr-2';
    setTimeout(() => {
        btnIcon.className = 'fa-solid fa-check text-green-400 mr-2';
        deployBtn.innerHTML = `<i class="fa-solid fa-check text-green-400 mr-2"></i>Agent Deployed`;
        setTimeout(() => {
            btnIcon.className = 'fa-solid fa-robot mr-2';
            deployBtn.innerHTML = `<i class="fa-solid fa-robot mr-2"></i>Deploy Consumer Agent`;
        }, 2000);
    }, 800);
});

// --- Generate Random TxHash ---
function generateTxHash() {
    const chars = '0123456789abcdef';
    let hash = '0x';
    for(let i=0; i<40; i++) hash += chars[Math.floor(Math.random() * chars.length)];
    return hash;
}

// --- Action: Run Cycle (API Call) ---
runBtn.addEventListener('click', async () => {
    // UI Loading State
    runBtn.disabled = true;
    runBtn.innerHTML = '<span class="z-10 relative"><i class="fa-solid fa-spinner fa-spin mr-2"></i>PROCESSING...</span>';
    
    chartPulseOuter.classList.remove('hidden');
    chartStatusText.textContent = 'STREAMING TELEMETRY';
    chartStatusText.className = 'text-xs font-mono text-cyber-cyan font-bold';
    
    // Simulate high load on chart
    startChartSimulation(true);

    try {
        const response = await fetch('/api/run');
        const data = await response.json();
        
        if (response.ok) {
            // Remove empty state message if it's the first tx
            if (transactionCount === 0) ledgerTableBody.innerHTML = '';
            
            transactionCount++;
            const txHash = generateTxHash();
            const amount = data.billing[0].amount.toFixed(4);

            // Add to Ledger Table
            const tr = document.createElement('tr');
            tr.className = 'text-gray-300 animate-slide-in hover:bg-white/5 transition-colors';
            tr.innerHTML = `
                <td class="py-3 px-3"><span class="truncate-hash text-cyber-purple cursor-pointer hover:text-white transition-colors" title="${txHash}">${txHash}</span></td>
                <td class="py-3 px-3">${data.billing[0].to}</td>
                <td class="py-3 px-3 text-cyber-cyan">${data.billing[0].from}</td>
                <td class="py-3 px-3 text-right font-bold text-cyber-orange">${amount}</td>
                <td class="py-3 px-3 text-right"><span class="bg-green-500/20 text-green-400 px-2 py-1 rounded text-xs">Settled</span></td>
            `;
            ledgerTableBody.prepend(tr); // Add to top

            // Update Wallets
            const oldProv = currentProviderBalance;
            const oldCons = currentConsumerBalance;
            currentProviderBalance = data.ledger.provider;
            currentConsumerBalance = data.ledger.consumer;

            animateValue(valProvider, oldProv, currentProviderBalance, 1500);
            animateValue(valConsumer, oldCons, currentConsumerBalance, 1500);
        } else {
            alert('API Error: ' + JSON.stringify(data));
        }

    } catch (err) {
        alert('Network Error: Could not reach API. ' + err.message);
    } finally {
        // Restore UI State
        runBtn.disabled = false;
        runBtn.innerHTML = '<span class="z-10 relative"><i class="fa-solid fa-bolt mr-2"></i>Execute Compute Job</span><i class="fa-solid fa-chevron-right z-10 relative opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all"></i><div class="absolute inset-0 bg-gradient-to-r from-cyber-orange/0 via-cyber-orange/10 to-cyber-orange/0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>';
        
        chartPulseOuter.classList.add('hidden');
        chartStatusText.textContent = 'IDLE';
        chartStatusText.className = 'text-xs font-mono text-gray-500';
        
        startChartSimulation(false); // Back to idle chart
    }
});
