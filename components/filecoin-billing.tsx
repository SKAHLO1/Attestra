"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useEVMWallet } from "@/lib/evm-wallet-context"
import { Synapse, calibration, TOKENS, parseUnits, formatUnits } from "@filoz/synapse-sdk"
import { http, custom } from "viem"
import { Wallet, RefreshCw, AlertTriangle, CheckCircle2, Loader2, Zap, Database } from "lucide-react"

interface BalanceInfo {
  serverWalletAddress: string
  walletBalanceFormatted: string
  depositedBalanceFormatted: string
  serviceApproved: boolean
  lowBalance: boolean
}

export default function FilecoinBilling() {
  const { address, walletClient, connecting, error: walletError, connect, disconnect } = useEVMWallet()

  const [balance, setBalance] = useState<BalanceInfo | null>(null)
  const [balanceLoading, setBalanceLoading] = useState(false)
  const [balanceError, setBalanceError] = useState<string | null>(null)

  const [depositAmount, setDepositAmount] = useState("2.5")
  const [depositing, setDepositing] = useState(false)
  const [depositError, setDepositError] = useState<string | null>(null)
  const [depositSuccess, setDepositSuccess] = useState<string | null>(null)

  const fetchBalance = useCallback(async () => {
    setBalanceLoading(true)
    setBalanceError(null)
    try {
      const res = await fetch("/api/synapse/balance")
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json()
      setBalance(data)
    } catch (err: any) {
      setBalanceError(err.message || "Failed to fetch balance")
    } finally {
      setBalanceLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchBalance()
  }, [fetchBalance])

  const handleDeposit = async () => {
    if (!walletClient || !address) return
    setDepositError(null)
    setDepositSuccess(null)

    const amount = parseFloat(depositAmount)
    if (isNaN(amount) || amount <= 0) {
      setDepositError("Enter a valid amount greater than 0")
      return
    }

    try {
      setDepositing(true)

      // Validate server-side and get chain info
      const prepRes = await fetch("/api/synapse/deposit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: depositAmount }),
      })
      if (!prepRes.ok) throw new Error(await prepRes.text())

      // Build Synapse client using the organizer's browser wallet as the account
      // The custom transport routes all signing through MetaMask
      const ethereum = (window as any).ethereum
      const synapse = Synapse.create({
        account: { address: address as `0x${string}`, type: "json-rpc" } as any,
        chain: calibration,
        transport: custom(ethereum),
      })

      const parsedAmount = parseUnits(depositAmount)

      // This triggers the MetaMask signature popup for the permit + deposit
      const hash = await synapse.payments.depositWithPermitAndApproveOperator({
        amount: parsedAmount,
      })

      setDepositSuccess(`Transaction submitted! Hash: ${hash.slice(0, 18)}...`)

      // Wait for confirmation then refresh balance
      await (synapse as any).client.waitForTransactionReceipt({ hash })
      setDepositSuccess(`✅ ${depositAmount} USDFC deposited successfully!`)
      await fetchBalance()
    } catch (err: any) {
      const msg = err.message || "Deposit failed"
      if (msg.includes("user rejected") || msg.includes("User denied")) {
        setDepositError("Transaction rejected in MetaMask.")
      } else {
        setDepositError(msg)
      }
    } finally {
      setDepositing(false)
    }
  }

  const statusColor = balance
    ? balance.lowBalance
      ? "text-red-600 bg-red-50 border-red-200"
      : "text-green-700 bg-green-50 border-green-200"
    : "text-gray-500 bg-gray-50 border-gray-200"

  const depositedNum = parseFloat(balance?.depositedBalanceFormatted ?? "0")

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight flex items-center gap-2">
            <Database className="w-5 h-5 text-blue-500" />
            Filecoin Storage Billing
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            USDFC funds Filecoin uploads. Top up via your EVM wallet (MetaMask).
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchBalance}
          disabled={balanceLoading}
          className="rounded-xl"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${balanceLoading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="rounded-2xl border-gray-100 shadow-sm">
          <CardContent className="pt-5">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Deposited Balance</p>
            {balanceLoading ? (
              <div className="h-8 w-24 bg-gray-100 rounded animate-pulse" />
            ) : (
              <div className="flex items-end gap-2">
                <span className={`text-2xl font-black ${depositedNum < 0.5 ? "text-red-600" : "text-gray-900"}`}>
                  {balance?.depositedBalanceFormatted ?? "—"}
                </span>
                <span className="text-xs font-bold text-gray-400 mb-1">USDFC</span>
              </div>
            )}
            {balance?.lowBalance && (
              <div className="flex items-center gap-1 mt-2">
                <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                <span className="text-xs text-red-600 font-bold">Low balance — uploads may fail</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-gray-100 shadow-sm">
          <CardContent className="pt-5">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Server Wallet USDFC</p>
            {balanceLoading ? (
              <div className="h-8 w-24 bg-gray-100 rounded animate-pulse" />
            ) : (
              <div className="flex items-end gap-2">
                <span className="text-2xl font-black text-gray-900">{balance?.walletBalanceFormatted ?? "—"}</span>
                <span className="text-xs font-bold text-gray-400 mb-1">USDFC</span>
              </div>
            )}
            {balance?.serverWalletAddress && (
              <p className="text-[10px] font-mono text-gray-400 mt-2 truncate">
                {balance.serverWalletAddress.slice(0, 10)}...{balance.serverWalletAddress.slice(-6)}
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-gray-100 shadow-sm">
          <CardContent className="pt-5">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Service Status</p>
            {balanceLoading ? (
              <div className="h-8 w-24 bg-gray-100 rounded animate-pulse" />
            ) : balance?.serviceApproved ? (
              <div className="flex items-center gap-2 mt-1">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
                <span className="text-sm font-bold text-green-700">Warm Storage Approved</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 mt-1">
                <AlertTriangle className="w-5 h-5 text-orange-500" />
                <span className="text-sm font-bold text-orange-700">Approval Needed</span>
              </div>
            )}
            <p className="text-[10px] text-gray-400 mt-2">Synapse Warm Storage operator</p>
          </CardContent>
        </Card>
      </div>

      {balanceError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 font-medium">
          {balanceError}
        </div>
      )}

      {/* EVM Wallet Section */}
      <Card className="rounded-2xl border-gray-100 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-black text-gray-900 flex items-center gap-2">
            <Wallet className="w-4 h-4 text-blue-500" />
            EVM Wallet (MetaMask)
          </CardTitle>
          <CardDescription>
            Connect your EVM wallet to deposit USDFC into the Filecoin storage payment contract.
            Your wallet pays — the server wallet receives the deposited funds.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!address ? (
            <div className="space-y-3">
              <Button
                onClick={connect}
                disabled={connecting}
                className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold"
              >
                {connecting ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Connecting...</>
                ) : (
                  <><Wallet className="w-4 h-4 mr-2" /> Connect MetaMask</>
                )}
              </Button>
              {walletError && (
                <p className="text-sm text-red-600 font-medium">{walletError}</p>
              )}
              <p className="text-xs text-gray-400">
                Will auto-switch to Filecoin Calibration Testnet network.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Connected State */}
              <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-xl">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <span className="text-sm font-bold text-green-700">Connected</span>
                  <code className="text-xs font-mono text-green-600 bg-green-100 px-2 py-0.5 rounded">
                    {address.slice(0, 8)}...{address.slice(-6)}
                  </code>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={disconnect}
                  className="text-gray-500 hover:text-red-500 text-xs"
                >
                  Disconnect
                </Button>
              </div>

              {/* Deposit Form */}
              <div className="space-y-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
                <p className="text-xs font-black text-gray-500 uppercase tracking-widest">
                  Deposit USDFC to Server Wallet
                </p>
                <p className="text-xs text-gray-400">
                  Deposited USDFC funds all Filecoin uploads. 2.5 USDFC ≈ 1 TiB storage for 30 days.
                </p>

                <div className="flex gap-2">
                  <Input
                    type="number"
                    min="0.1"
                    step="0.1"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    className="rounded-xl bg-white border-gray-200 font-mono"
                    placeholder="2.5"
                  />
                  <span className="flex items-center text-sm font-bold text-gray-500 px-2">USDFC</span>
                </div>

                {/* Quick amount buttons */}
                <div className="flex gap-2">
                  {["1", "2.5", "5", "10"].map((amt) => (
                    <button
                      key={amt}
                      onClick={() => setDepositAmount(amt)}
                      className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-colors ${
                        depositAmount === amt
                          ? "bg-gray-900 text-white border-gray-900"
                          : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
                      }`}
                    >
                      {amt}
                    </button>
                  ))}
                </div>

                <Button
                  onClick={handleDeposit}
                  disabled={depositing}
                  className="w-full bg-gray-900 hover:bg-black text-white rounded-xl font-black uppercase tracking-widest"
                >
                  {depositing ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Waiting for MetaMask...</>
                  ) : (
                    <><Zap className="w-4 h-4 mr-2" /> Deposit {depositAmount} USDFC</>
                  )}
                </Button>

                {depositError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 font-medium">
                    {depositError}
                  </div>
                )}
                {depositSuccess && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700 font-medium flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    {depositSuccess}
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info */}
      <div className="text-xs text-gray-400 space-y-1 p-4 bg-gray-50 rounded-xl border border-gray-100">
        <p className="font-bold text-gray-500 uppercase tracking-widest text-[10px] mb-2">How it works</p>
        <p>• All Filecoin uploads are paid from the <strong>server wallet</strong> deposited balance</p>
        <p>• Attendees never interact with Filecoin — only Flow (3 FLOW badge claim)</p>
        <p>• Top up here when the deposited balance runs low (&lt; 0.5 USDFC warning)</p>
        <p>• Each event creation, badge claim, QR manifest, and AI verification artifact costs a small amount of USDFC</p>
      </div>
    </div>
  )
}
