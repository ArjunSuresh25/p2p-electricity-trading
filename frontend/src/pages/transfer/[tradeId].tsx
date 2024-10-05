import Head from "next/head";
import { NextPageWithLayout } from "../_app";
import ApplicationShell from "@/layouts/ApplicationShell";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import useStore from "@/store/store";
import { Badge, Button, Card } from "@mantine/core";
import { Progress } from "@mantine/core";
import { IconPlayerPlay } from "@tabler/icons-react";
import { io } from "socket.io-client";
import { usePathname } from "next/navigation";
import { ethers, parseEther } from "ethers";

const getLastPath = (url: string) => {
  if (url == null) return null;
  const paths = url.split("/");
  return paths.pop() || paths.pop();
};

const walletAddresses = [
  "0x5C39566D39B49458642A1CA337ee13Fbfdb03cA5",
  "0x25B3E236aE0AAA27EaBfFeC0f5000d8B4332b4ce",
];

const Transfer: NextPageWithLayout = () => {
  const router = useRouter();
  const logOutUser = useStore((state) => state.logOutUser);
  const ethereum = useStore((state) => state.ethereum);
  const [trade, setTrade] = useState<any>(null);
  const user = useStore((state) => state.user);
  const [progress, setProgress] = useState(0);
  const currentPage = usePathname();
  const tradeId = getLastPath(currentPage);
  const tradeHistory = useStore((state) => state.tradeHistory);

  function updateTradeDetails() {
    fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/trades/trade?tradeId=${tradeId}`,
      {
        credentials: "include",
      }
    )
      .then((response) => {
        if (response.status === 401) {
          logOutUser();
          throw new Error("Session expired");
        }
        return response;
      })
      .then((response) => response.json())
      .then((trade) => {
        setTrade(trade);
        if (trade.status.toLowerCase() === "completed") setProgress(100);
      })
      .catch(console.error);
  }

  useEffect(() => {
    tradeId && updateTradeDetails();
  }, [tradeId]);

  function handleProgressUpdates(data: any, trade: any) {
    // console.log(data.tradeId, tradeId);
    if (data.tradeId) {
      setProgress(data.currentProgress);
      if (data.currentProgress === 100) {
        const trade = tradeHistory.find((trade) => trade.id === data.tradeId);
        if (trade?.buyerId === user?.userId) {
          const provider = new ethers.BrowserProvider(window.ethereum);
          provider
            .getSigner()
            .then((signer: any) => {
              signer.sendTransaction({
                to: walletAddresses.find(
                  (address) => address !== ethereum?.signer.address
                ),
                value: parseEther(trade?.price + ""),
              });
            })
            .then(console.log)
            .catch(console.error);
        }

        fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/trades/complete/${data.tradeId}`,
          {
            method: "PUT",
            body: null,
            headers: {
              "Content-Type": "application/json",
            },
            credentials: "include",
          }
        )
          .then((response) => {
            if (response.status !== 200) throw response;
            return response.json();
          })
          .then(() => updateTradeDetails())
          .catch(console.error);
      }
    }
  }

  const [socket, setSocket] = useState(() => {
    const socket = io(`${process.env.NEXT_PUBLIC_BACKEND_URL}`, {
      reconnectionDelayMax: 10000,
    });

    socket.on("updateProgress", (data) =>
      handleProgressUpdates(data, Object.assign({}, trade))
    );

    return socket;
  });

  return (
    <main>
      <Head>
        <title>Transfer</title>
      </Head>
      {trade && (
        <div className="text-lg">
          <h1 className="text-2xl font-semibold m-0 mb-2">Hi, {user?.name}</h1>
          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Card.Section className="p-4">
              <div>Trade ID: {tradeId}</div>
              <div>Quantity: {trade.quantity} WHr</div>
              <div>Price: {trade.price} ETH</div>
              <div>
                Buyer ID: {trade.buyerId}{" "}
                {trade.buyerId === user?.userId && (
                  <span className="font-bold">(You)</span>
                )}
              </div>
              <div>
                Seller ID: {trade.sellerId}{" "}
                {trade.sellerId === user?.userId && (
                  <span className="font-bold">(You)</span>
                )}
              </div>
              <div>
                Placed At: {new Date(trade.timePlaced).toLocaleString()}
              </div>
              <div>
                Status:{" "}
                <Badge
                  color={
                    trade.status.toLowerCase() === "completed"
                      ? "green"
                      : trade.status.toLowerCase() === "in_progress"
                      ? "orange"
                      : trade.status.toLowerCase() === "pending"
                      ? "yellow"
                      : "red"
                  }
                >
                  {trade.status.replace("_", " ")}
                </Badge>
              </div>
            </Card.Section>
          </Card>
          <h2 className="text-xl font-bold mt-8 mb-2">Progress</h2>
          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Card.Section className="p-4">
              <div className="flex items-center gap-4">
                <Progress value={progress} className="flex-1" />
                <span>{progress} %</span>
              </div>
              {trade.sellerId === user?.userId && (
                <Button
                  onClick={() => {
                    fetch(
                      `${process.env.NEXT_PUBLIC_BACKEND_URL}/trades/start-transfer/${tradeId}`,
                      {
                        method: "PUT",
                        body: null,
                        headers: {
                          "Content-Type": "application/json",
                        },
                        credentials: "include",
                      }
                    )
                      .then((response) => {
                        if (response.status !== 200) throw response;
                        return response.json();
                      })
                      .then(console.log)
                      .catch(console.error);
                  }}
                  // variant="primary"
                  leftIcon={<IconPlayerPlay />}
                  disabled={progress > 0}
                >
                  Start Transfer
                </Button>
              )}
            </Card.Section>
          </Card>
        </div>
      )}
    </main>
  );
};

Transfer.getLayout = function getLayout(page) {
  return <ApplicationShell>{page}</ApplicationShell>;
};

export default Transfer;
