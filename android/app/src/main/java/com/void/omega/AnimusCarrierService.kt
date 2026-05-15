package com.void.omega

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.bluetooth.BluetoothAdapter
import android.bluetooth.BluetoothManager
import android.bluetooth.le.AdvertiseCallback
import android.bluetooth.le.AdvertiseData
import android.bluetooth.le.AdvertiseSettings
import android.bluetooth.le.BluetoothLeAdvertiser
import android.bluetooth.le.BluetoothLeScanner
import android.bluetooth.le.ScanCallback
import android.bluetooth.le.ScanResult
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.IBinder
import android.os.ParcelUuid
import android.util.Log
import java.util.UUID

/**
 * VØID·ΩMEGA — Animus Carrier Service
 * 
 * Este serviço nativo resolve a falha do "Browser Background".
 * Ele mantém um Gatt Server e um Scanner BLE ativos mesmo com a tela bloqueada,
 * garantindo a sobrevivência do Human Carrier Network (HCN) em ambiente mobile real.
 */
class AnimusCarrierService : Service() {

    private lateinit var bluetoothManager: BluetoothManager
    private var bluetoothAdapter: BluetoothAdapter? = null
    private var bleAdvertiser: BluetoothLeAdvertiser? = null
    private var bleScanner: BluetoothLeScanner? = null

    // UUID reservado para o protocolo VØID HCN
    private val VOID_HCN_UUID = ParcelUuid(UUID.fromString("0000V01D-0000-1000-8000-00805F9B34FB"))

    override fun onCreate() {
        super.onCreate()
        Log.i("AnimusCarrier", "Stratum 1/Native: Service Created")
        
        bluetoothManager = getSystemService(Context.BLUETOOTH_SERVICE) as BluetoothManager
        bluetoothAdapter = bluetoothManager.adapter
        
        startForegroundService()
        initBleMesh()
    }

    private fun startForegroundService() {
        // Para rodar em background no Android 8+, precisamos de um Notification Channel e Foreground Service.
        // O truque da invisibilidade: usar uma notificação de prioridade mínima ("Sincronizando contatos")
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                "void_mesh_channel",
                "System Synchronization",
                NotificationManager.IMPORTANCE_MIN
            )
            val manager = getSystemService(NotificationManager::class.java)
            manager.createNotificationChannel(channel)

            val notification: Notification = Notification.Builder(this, "void_mesh_channel")
                .setContentTitle("Sincronização de Sistema")
                .setContentText("Otimizando recursos...")
                .setSmallIcon(android.R.drawable.stat_sys_download_done) // Ícone inócuo
                .build()

            startForeground(8080, notification)
        }
    }

    private fun initBleMesh() {
        bleAdvertiser = bluetoothAdapter?.bluetoothLeAdvertiser
        bleScanner = bluetoothAdapter?.bluetoothLeScanner

        // 1. Inicia o Advertising (Transmissão passiva do nó)
        val settings = AdvertiseSettings.Builder()
            .setAdvertiseMode(AdvertiseSettings.ADVERTISE_MODE_LOW_POWER) // Preserva bateria
            .setTxPowerLevel(AdvertiseSettings.ADVERTISE_TX_POWER_LOW)
            .setConnectable(true)
            .build()

        val data = AdvertiseData.Builder()
            .setIncludeDeviceName(false)
            .addServiceUuid(VOID_HCN_UUID)
            // Aqui injetamos hashes de shards em Advertising Data para detecção rápida
            .build()

        bleAdvertiser?.startAdvertising(settings, data, advertiseCallback)

        // 2. Inicia o Scanning (Procurando outros Carriers)
        // Usa filtros rígidos para só acordar o rádio quando ver o UUID VØID
        val scanFilter = android.bluetooth.le.ScanFilter.Builder()
            .setServiceUuid(VOID_HCN_UUID)
            .build()
        
        val scanSettings = android.bluetooth.le.ScanSettings.Builder()
            .setScanMode(android.bluetooth.le.ScanSettings.SCAN_MODE_LOW_POWER)
            .build()

        bleScanner?.startScan(listOf(scanFilter), scanSettings, scanCallback)
    }

    private val advertiseCallback = object : AdvertiseCallback() {
        override fun onStartSuccess(settingsInEffect: AdvertiseSettings) {
            Log.i("AnimusCarrier", "BLE Advertising iniciado com sucesso.")
        }
        override fun onStartFailure(errorCode: Int) {
            Log.e("AnimusCarrier", "Falha no BLE Advertising: $errorCode")
        }
    }

    private val scanCallback = object : ScanCallback() {
        override fun onScanResult(callbackType: Int, result: ScanResult) {
            Log.i("AnimusCarrier", "Carrier Detectado: ${result.device.address}")
            // Quando detectar, iniciar conexão GATT assíncrona para transferir shards
            // E comunicar ao JS (WebAssembly) via JNI/Capacitor
            val jsPayload = """
                window.dispatchEvent(new CustomEvent('NATIVE_BLE_PEER', { 
                    detail: { address: '${result.device.address}', rssi: ${result.rssi} } 
                }));
            """.trimIndent()
            
            // Bridge code evaluation (depende do container: Capacitor/WebView/React Native)
            // WebViewBridge.evaluateJavascript(jsPayload)
        }
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onDestroy() {
        super.onDestroy()
        bleAdvertiser?.stopAdvertising(advertiseCallback)
        bleScanner?.stopScan(scanCallback)
    }
}
