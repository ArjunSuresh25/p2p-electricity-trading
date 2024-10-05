import ApplicationShell from "@/layouts/ApplicationShell";
import { NextPageWithLayout } from "../_app";
import Head from "next/head";
import useStore from "@/store/store";
import useClientLoaded from "@/hooks/useClientLoaded";
import TradePanel from "./components/TradePanel";
import TradeHistory from "./components/TradeHistory";
import StatsPanel from "./components/StatsPanel";
import { ethers, formatEther, parseEther } from "ethers";
import { Button } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconPlus, IconX } from "@tabler/icons-react";
import { useEffect, useState } from "react";

const Dashboard: NextPageWithLayout = () => {
  const user = useStore((state) => state.user);
  const ethereum = useStore((state) => state.ethereum);
  const setEthereum = useStore((state) => state.setEthereum);
  const clientLoaded = useClientLoaded();

  const [walletConnectionInProgress, setWalletConnectionInProgress] =
    useState(false);

  const connectWallet = () => {
    if (window.ethereum != null) {
      setWalletConnectionInProgress(true);
      // Connect to the MetaMask EIP-1193 object. This is a standard
      // protocol that allows Ethers access to make all read-only
      // requests through MetaMask.
      const provider = new ethers.BrowserProvider(window.ethereum);

      // It also provides an opportunity to request access to write
      // operations, which will be performed by the private key
      // that MetaMask manages for the user.
      provider
        .getSigner()
        .then((signer) => {
          provider.getBalance(signer.address).then((balance) => {
            setEthereum({ provider, signer, balance: formatEther(balance) });
          });
          setWalletConnectionInProgress(false);
        })
        .catch(console.error);
    } else {
      notifications.show({
        id: "no-wallet-error",
        color: "red",
        title: "Wallet not found",
        message: "Install an ETH wallet like MetaMask to continue.",
        icon: <IconX size="1rem" />,
        autoClose: 5000,
      });
    }
  };

  // useEffect(() => {
  //   const provider = new ethers.BrowserProvider(window.ethereum);

  //   provider
  //     .getSigner()
  //     .then((signer: any) => {
  //       signer.sendTransaction({
  //         to: "0x25B3E236aE0AAA27EaBfFeC0f5000d8B4332b4ce",
  //         value: parseEther("0.3"),
  //       });
  //     })
  //     .then(console.log)
  //     .catch(console.error);
  // }, []);

  return (
    <main>
      <Head>
        <title>Dashboard</title>
      </Head>
      {clientLoaded && (
        <div>
          <h1 className="text-2xl font-semibold m-0 mb-2">Hi, {user?.name}</h1>
          {ethereum === null ? (
            <Button
              onClick={connectWallet}
              variant="light"
              leftIcon={<IconPlus />}
              loading={walletConnectionInProgress}
            >
              Connect ETH Wallet
            </Button>
          ) : (
            <div>
              <div className="break-all">Wallet: {ethereum.signer.address}</div>
              <div>Balance: {ethereum.balance} ETH</div>
            </div>
          )}
          <StatsPanel />
          <TradePanel />
          <TradeHistory />
        </div>
      )}
    </main>
  );
};

Dashboard.getLayout = function getLayout(page) {
  return <ApplicationShell>{page}</ApplicationShell>;
};

export default Dashboard;
