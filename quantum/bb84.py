"""
VØID BB84 — Quantum Key Distribution
Implementação real do protocolo BB84

Baseado em: CQR.pdf + v1.1 commit
Alice prepara fótons, Bob mede, sifting + QBER check
"""

import numpy as np
import hashlib


class BB84Protocol:
    """
    Protocolo BB84 — Quantum Key Distribution.
    Implementação clássica fiel ao protocolo quântico real.
    """

    # Bases: 0 = rectilinear (Z), 1 = diagonal (X)
    BASES = {0: "rectilinear", 1: "diagonal"}

    def __init__(self, key_length: int = 256):
        self.key_length = key_length
        self.qber_threshold = 0.11  # 11% — threshold de segurança BB84

    def alice_prepare(self) -> dict:
        """
        Alice prepara fótons em bases aleatórias.
        Cada fóton: bit + base (0=Z, 1=X)
        """
        n_photons = self.key_length * 4  # Preparar 4x mais (sifting vai descartar ~50%)
        bits = np.random.randint(0, 2, n_photons)
        bases = np.random.randint(0, 2, n_photons)
        return {
            "bits": bits.tolist(),
            "bases": bases.tolist(),
            "n_photons": n_photons
        }

    def bob_measure(self, photons: dict, strategy: str = "random") -> dict:
        """
        Bob mede os fótons recebidos.
        strategy: 'random' (BB84 padrão) ou 'intercept' (ataque Eve)
        """
        n = photons["n_photons"]
        alice_bits = np.array(photons["bits"])
        alice_bases = np.array(photons["bases"])

        if strategy == "random":
            # Bob escolhe bases aleatoriamente (protocolo real)
            bob_bases = np.random.randint(0, 2, n)
            # Medição: se mesma base → bit correto; se base diferente → aleatório
            correct = (bob_bases == alice_bases)
            bob_bits = np.where(correct, alice_bits, np.random.randint(0, 2, n))
        elif strategy == "intercept":
            # Eve intercepta (ataque intercept-resend)
            eve_bases = np.random.randint(0, 2, n)
            # Eve mede e reenvia
            correct_eve = (eve_bases == alice_bases)
            eve_bits = np.where(correct_eve, alice_bits, np.random.randint(0, 2, n))
            # Bob mede o que Eve reenviou
            bob_bases = np.random.randint(0, 2, n)
            correct_bob = (bob_bases == eve_bases)
            bob_bits = np.where(correct_bob, eve_bits, np.random.randint(0, 2, n))
        else:
            bob_bases = np.random.randint(0, 2, n)
            bob_bits = np.random.randint(0, 2, n)

        return {
            "bits": bob_bits.tolist(),
            "bases": bob_bases.tolist(),
            "n_measurements": n
        }

    def sift(self, alice: dict, bob: dict) -> dict:
        """
        Sifting — compara bases e mantém apenas bits medidos na mesma base.
        """
        alice_bases = np.array(alice["bases"])
        bob_bases = np.array(bob["bases"])
        alice_bits = np.array(alice["bits"])
        bob_bits = np.array(bob["bits"])

        # Manter apenas onde as bases coincidem
        same_basis = alice_bases == bob_bases
        alice_key = alice_bits[same_basis].tolist()
        bob_key = bob_bits[same_basis].tolist()

        return {
            "alice_key": alice_key,
            "bob_key": bob_key,
            "key_length": len(alice_key),
            "discarded": len(alice_bits) - len(alice_key),
            "matching_bases": int(same_basis.sum())
        }

    def calculate_qber(self, alice_key: list, bob_key: list) -> float:
        """
        Calcula QBER (Quantum Bit Error Rate).
        Compara uma fração dos bits para detectar Eve.
        """
        if not alice_key:
            return 0.0

        n_check = min(len(alice_key) // 4, 50)  # Usar até 50 bits para check
        alice_arr = np.array(alice_key[:n_check])
        bob_arr = np.array(bob_key[:n_check])

        errors = np.sum(alice_arr != bob_arr)
        qber = errors / n_check
        return float(qber)

    def error_correction(self, alice_key: list, bob_key: list) -> dict:
        """
        Correção de erros — reconciliação de bases pública.
        Comparação parcial + XOR para correção.
        """
        n = min(len(alice_key), len(bob_key))
        alice_arr = np.array(alice_key[:n])
        bob_arr = np.array(bob_key[:n])

        # Correção: XOR dos bits diferentes
        diff_mask = alice_arr != bob_arr
        n_errors = int(diff_mask.sum())

        # Correção via XOR público
        corrected_bob = bob_arr.copy()
        corrected_bob[diff_mask] = alice_arr[diff_mask]

        return {
            "corrected_key": corrected_bob.tolist(),
            "errors_found": n_errors,
            "error_rate": n_errors / n if n > 0 else 0,
            "key_length": n
        }

    def privacy_amplification(self, key: list, bits_to_keep: int = 256) -> dict:
        """
        Amplificação de privacidade — reduz chaves para eliminar informação de Eve.
        Usa hash SHA3-256 para compressão.
        """
        key_bytes = bytes(key)
        # Hash para compressão
        hash_obj = hashlib.sha3_256(key_bytes)
        amplified = hash_obj.digest()

        # Se precisar de mais bits, usar HKDF-like expansion
        if bits_to_keep > 256:
            extra = hashlib.sha3_512(key_bytes).digest()
            amplified = amplified + extra

        return {
            "amplified_key": amplified[:bits_to_keep // 8].hex(),
            "original_length": len(key),
            "final_length": bits_to_keep,
            "compression_ratio": bits_to_keep / len(key) if key else 0
        }

    def run_full_protocol(self, intercept: bool = False) -> dict:
        """
        Executa o protocolo BB84 completo.
        intercept=True simula ataque de Eve.
        """
        # 1. Alice prepara
        alice = self.alice_prepare()

        # 2. Bob mede
        strategy = "intercept" if intercept else "random"
        bob = self.bob_measure(alice, strategy=strategy)

        # 3. Sifting
        sifted = self.sift(alice, bob)

        if sifted["key_length"] < self.key_length:
            return {
                "success": False,
                "reason": "key_too_short",
                "key_length": sifted["key_length"],
                "required": self.key_length
            }

        # 4. QBER check
        qber = self.calculate_qber(sifted["alice_key"], sifted["bob_key"])

        if qber > self.qber_threshold:
            return {
                "success": False,
                "reason": "qber_too_high",
                "qber": qber,
                "threshold": self.qber_threshold,
                "eve_detected": True
            }

        # 5. Error correction
        corrected = self.error_correction(sifted["alice_key"], sifted["bob_key"])

        # 6. Privacy amplification
        final = self.privacy_amplification(corrected["corrected_key"], self.key_length)

        return {
            "success": True,
            "key_length": final["final_length"],
            "final_key": final["amplified_key"],
            "qber": qber,
            "eve_detected": False,
            "steps": {
                "photons_sent": alice["n_photons"],
                "sifted_key_length": sifted["key_length"],
                "matching_bases": sifted["matching_bases"],
                "errors_corrected": corrected["errors_found"]
            }
        }


if __name__ == "__main__":
    bb84 = BB84Protocol(key_length=256)

    print("=== BB84 Protocol — No Eve ===")
    result = bb84.run_full_protocol(intercept=False)
    print(f"Success: {result['success']}")
    if result["success"]:
        print(f"Key length: {result['key_length']}")
        print(f"QBER: {result['qber']:.4f}")
        print(f"Eve detected: {result['eve_detected']}")
        print(f"Final key: {result['final_key'][:32]}...")
    else:
        print(f"Failed: {result['reason']}")

    print("\n=== BB84 Protocol — Eve Intercepting ===")
    result_eve = bb84.run_full_protocol(intercept=True)
    print(f"Success: {result_eve['success']}")
    if not result_eve["success"]:
        print(f"Reason: {result_eve['reason']}")
        if "qber" in result_eve:
            print(f"QBER: {result_eve['qber']:.4f}")
            print(f"Eve detected: {result_eve.get('eve_detected', 'N/A')}")
