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

// --- Action: Deploy & Stake (Web3 Transactions) ---
const stakeBtn = document.getElementById('stakeBtn');

async function executeWeb3Transaction(btnElement, actionName, originalHtml, successHtml) {
    if (!isWalletConnected) {
        alert('Please connect your wallet first!');
        return;
    }

    btnElement.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin mr-2"></i>Waiting for Signature...`;
    
    try {
        if (connectedWalletType === 'MetaMask' && typeof window.ethereum !== 'undefined') {
            // Use personal_sign instead of eth_sendTransaction to avoid "insufficient funds for gas" errors
            const message = `Sign this message to confirm action: ${actionName}\n\nThis is a gas-less signature for the Unicity Compute Oracle Hackathon Demo.`;
            // hex encode the message
            const hexMessage = '0x' + Array.from(new TextEncoder().encode(message), byte => byte.toString(16).padStart(2, '0')).join('');
            
            await window.ethereum.request({ 
                method: 'personal_sign', 
                params: [hexMessage, connectedWalletAddress] 
            });
        } else if (connectedWalletType === 'Phantom' && window.solana && window.solana.isPhantom) {
            // Dummy signature request
            const message = `Sign this message to confirm action: ${actionName}\n\nThis is a gas-less signature for the Unicity Compute Oracle Hackathon Demo.`;
            const encodedMessage = new TextEncoder().encode(message);
            await window.solana.signMessage(encodedMessage, "utf8");
        } else {
            // Simulated delay for Unicity Wallet
            await new Promise(resolve => setTimeout(resolve, 2000));
        }

        // Success State
        btnElement.innerHTML = successHtml;
        setTimeout(() => {
            btnElement.innerHTML = originalHtml;
        }, 3000);

    } catch (err) {
        console.error('Transaction failed/rejected:', err);
        btnElement.innerHTML = `<i class="fa-solid fa-xmark text-red-500 mr-2"></i>Rejected`;
        setTimeout(() => {
            btnElement.innerHTML = originalHtml;
        }, 2000);
    }
}

deployBtn.addEventListener('click', () => {
    executeWeb3Transaction(
        deployBtn, 
        'Deploy Consumer Agent',
        `<i class="fa-solid fa-robot mr-2"></i>Deploy Consumer Agent`,
        `<i class="fa-solid fa-check text-green-400 mr-2"></i>Agent Deployed`
    );
});

stakeBtn.addEventListener('click', () => {
    executeWeb3Transaction(
        stakeBtn, 
        'Stake UTKN (Validator)',
        `<i class="fa-solid fa-coins mr-2"></i>Stake UTKN (Validator)`,
        `<i class="fa-solid fa-check text-green-400 mr-2"></i>Stake Successful`
    );
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

// --- Wallet Connection Logic ---
const connectWalletBtn = document.getElementById('connectWalletBtn');
const walletDropdown = document.getElementById('walletDropdown');
const disconnectWalletBtn = document.getElementById('disconnectWalletBtn');
const dropdownNetwork = document.getElementById('dropdownNetwork');
const walletModal = document.getElementById('walletModal');
const walletModalContent = document.getElementById('walletModalContent');
const closeModalBtn = document.getElementById('closeModalBtn');
const walletOptions = document.querySelectorAll('.wallet-option');
const walletIcon = document.getElementById('walletIcon');
const walletText = document.getElementById('walletText');

let isWalletConnected = false;
let connectedWalletType = null;
let connectedWalletAddress = null;

// Generate fake address
function getFakeAddress() {
    const chars = '0123456789abcdef';
    let hash = '0x';
    for(let i=0; i<40; i++) hash += chars[Math.floor(Math.random() * chars.length)];
    return hash.substring(0,6) + '...' + hash.substring(38);
}

// Check local storage on load
function initWalletState() {
    const savedType = localStorage.getItem('walletType');
    const savedAddress = localStorage.getItem('walletAddress');
    
    if (savedType && savedAddress) {
        isWalletConnected = true;
        connectedWalletType = savedType;
        connectedWalletAddress = savedAddress;
        
        const displayAddress = savedAddress.substring(0, 6) + '...' + savedAddress.substring(savedAddress.length - 4);
        walletIcon.className = 'fa-solid fa-circle text-green-400 text-[10px] mr-2 animate-pulse';
        walletText.textContent = displayAddress;
        walletText.className = 'font-mono text-white tracking-wider';
        
        if (savedType === 'MetaMask') dropdownNetwork.textContent = 'Ethereum Sepolia';
        else if (savedType === 'Phantom') dropdownNetwork.textContent = 'Solana Devnet';
        else dropdownNetwork.textContent = 'Unicity Testnet';
    }
}
initWalletState();

// Toggle Modal
function openModal() {
    walletModal.classList.remove('hidden');
    walletModal.classList.add('flex');
    setTimeout(() => {
        walletModal.classList.remove('opacity-0');
        walletModalContent.classList.remove('scale-95');
        walletModalContent.classList.add('scale-100');
    }, 10);
}

function closeModal() {
    walletModal.classList.add('opacity-0');
    walletModalContent.classList.remove('scale-100');
    walletModalContent.classList.add('scale-95');
    setTimeout(() => {
        walletModal.classList.add('hidden');
        walletModal.classList.remove('flex');
    }, 300);
}

closeModalBtn.addEventListener('click', closeModal);
walletModal.addEventListener('click', (e) => {
    if (e.target === walletModal) closeModal();
});

// Click Connect Wallet Button
connectWalletBtn.addEventListener('click', () => {
    if (isWalletConnected) {
        // Toggle dropdown if connected
        walletDropdown.classList.toggle('hidden');
    } else {
        // Open modal if disconnected
        openModal();
    }
});

// Select Wallet Option
walletOptions.forEach(btn => {
    btn.addEventListener('click', async (e) => {
        const walletName = btn.getAttribute('data-wallet');
        const networkName = btn.getAttribute('data-network');
        
        // Show loading state
        const originalHtml = btn.innerHTML;
        btn.innerHTML = `<div class="flex items-center justify-center w-full py-2"><i class="fa-solid fa-circle-notch fa-spin text-cyber-cyan mr-3"></i><span class="text-white font-bold text-sm">Waiting for signature...</span></div>`;
        
        try {
            let realAddress = null;

            if (walletName === 'MetaMask') {
                if (typeof window.ethereum !== 'undefined') {
                    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
                    realAddress = accounts[0];
                } else {
                    alert('MetaMask extension is not installed or not detected!');
                    throw new Error('No MetaMask');
                }
            } else if (walletName === 'Phantom') {
                if (window.solana && window.solana.isPhantom) {
                    const resp = await window.solana.connect();
                    realAddress = resp.publicKey.toString();
                } else {
                    alert('Phantom extension is not installed or not detected!');
                    throw new Error('No Phantom');
                }
            } else {
                // Fallback for Unicity Native Wallet (Simulated)
                await new Promise(resolve => setTimeout(resolve, 1500));
                realAddress = getFakeAddress();
            }

            // Success connected
            isWalletConnected = true;
            connectedWalletType = walletName;
            connectedWalletAddress = realAddress;
            dropdownNetwork.textContent = networkName;
            
            // Save to LocalStorage
            localStorage.setItem('walletType', connectedWalletType);
            localStorage.setItem('walletAddress', connectedWalletAddress);

            // Format address
            const displayAddress = realAddress.substring(0, 6) + '...' + realAddress.substring(realAddress.length - 4);

            // Update Nav Button
            walletIcon.className = 'fa-solid fa-circle text-green-400 text-[10px] mr-2 animate-pulse';
            walletText.textContent = displayAddress;
            walletText.className = 'font-mono text-white tracking-wider';
            
            closeModal();
        } catch (err) {
            console.error('Wallet connection rejected or failed:', err);
        } finally {
            btn.innerHTML = originalHtml; // Reset for next time
        }
    });
});

// Disconnect Wallet
disconnectWalletBtn.addEventListener('click', () => {
    isWalletConnected = false;
    connectedWalletType = null;
    connectedWalletAddress = null;
    walletDropdown.classList.add('hidden');
    
    // Clear LocalStorage
    localStorage.removeItem('walletType');
    localStorage.removeItem('walletAddress');
    
    // Revert Nav Button
    walletIcon.className = 'fa-solid fa-wallet mr-2';
    walletText.textContent = 'Connect Wallet';
    walletText.className = ''; 
});

// Close dropdown when clicking outside
document.addEventListener('click', (e) => {
    if (!connectWalletBtn.contains(e.target) && !walletDropdown.contains(e.target)) {
        walletDropdown.classList.add('hidden');
    }
});
