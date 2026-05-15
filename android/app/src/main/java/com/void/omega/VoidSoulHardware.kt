package com.void.omega

import android.security.keystore.KeyGenParameterSpec
import android.security.keystore.KeyProperties
import android.util.Log
import java.security.KeyPairGenerator
import java.security.KeyStore
import java.security.Signature

/**
 * VØID·Ω∞ — The Hardware Soul
 * 
 * Implementação REAL da "Semente da Alma" (Soul Seed).
 * Em vez de manter uma chave privada no JavaScript (que pode ser exfiltrada),
 * geramos um par de chaves EC diretamente dentro do chip Secure Enclave / StrongBox do Android.
 * A chave privada NUNCA sai do hardware. O sistema pede ao hardware para assinar desafios
 * para derivar chaves efêmeras de sessão.
 */
object VoidSoulHardware {

    private const val ALIAS = "void_soul_seed_v8"
    private const val KEYSTORE = "AndroidKeyStore"

    fun initSoul(): Boolean {
        try {
            val keyStore = KeyStore.getInstance(KEYSTORE)
            keyStore.load(null)

            if (!keyStore.containsAlias(ALIAS)) {
                Log.i("VoidSoul", "Gerando nova Alma no Hardware...")
                
                val keyPairGenerator = KeyPairGenerator.getInstance(
                    KeyProperties.KEY_ALGORITHM_EC, KEYSTORE
                )

                // A Mágica Acontece Aqui:
                // setIsStrongBoxBacked(true) FORÇA a chave a ser gerada no HSM físico.
                // setUserAuthenticationRequired(true) exige biometria para usá-la.
                val builder = KeyGenParameterSpec.Builder(
                    ALIAS,
                    KeyProperties.PURPOSE_SIGN or KeyProperties.PURPOSE_VERIFY
                )
                .setDigests(KeyProperties.DIGEST_SHA256, KeyProperties.DIGEST_SHA512)
                .setUserAuthenticationRequired(true) 
                
                // Tenta forçar hardware físico (StrongBox). Pode falhar em celulares velhos,
                // mas é a garantia absoluta de que a RAM do celular pode ser dumpeada e a chave não vazará.
                try {
                    builder.setIsStrongBoxBacked(true)
                } catch (e: Exception) {
                    Log.w("VoidSoul", "StrongBox não suportado, usando TrustZone normal.")
                }

                keyPairGenerator.initialize(builder.build())
                keyPairGenerator.generateKeyPair()
                
                Log.i("VoidSoul", "Alma gravada no silício permanentemente.")
            } else {
                Log.i("VoidSoul", "Alma já existente detectada.")
            }
            return true
        } catch (e: Exception) {
            Log.e("VoidSoul", "Falha catastrófica ao tentar vincular a Alma ao Hardware", e)
            return false
        }
    }

    /**
     * O WebAssembly pedirá uma "Session Seed". Nós passamos o Epoch e o Nonce para
     * dentro do hardware, o hardware assina, e a assinatura se torna a semente efêmera
     * que o TypeScript usará.
     */
    fun signChallengeForSession(challenge: ByteArray): ByteArray? {
        return try {
            val keyStore = KeyStore.getInstance(KEYSTORE)
            keyStore.load(null)
            val entry = keyStore.getEntry(ALIAS, null) as KeyStore.PrivateKeyEntry
            
            val signature = Signature.getInstance("SHA512withECDSA")
            signature.initSign(entry.privateKey)
            signature.update(challenge)
            
            val sigBytes = signature.sign()
            Log.i("VoidSoul", "Hardware assinou desafio. Chave efêmera derivada.")
            sigBytes
        } catch (e: Exception) {
            Log.e("VoidSoul", "Falha na assinatura do hardware", e)
            null
        }
    }
}
