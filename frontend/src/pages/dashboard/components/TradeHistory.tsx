import useStore from "@/store/store";
import { Badge, Button, Table } from "@mantine/core";
import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { useRouter } from "next/navigation";

const TradeHistory = () => {
  const tradeHistory = useStore((state) => state.tradeHistory);
  const setTradeHistory = useStore((state) => state.setTradeHistory);
  const ethereum = useStore((state) => state.ethereum);
  const user = useStore((state) => state.user);
  const logOutUser = useStore((state) => state.logOutUser);
  const router = useRouter();

  const updateTrades = () => {
    fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/trades/`, {
      credentials: "include",
    })
      .then((response) => {
        if (response.status === 401) {
          logOutUser();
          throw new Error("Session expired");
        }
        return response;
      })
      .then((response) => response.json())
      .then((trades) => {
        setTradeHistory(
          trades
            .map((trade: any) => ({
              id: trade.tradeId,
              type:
                trade.buyerId === user?.userId
                  ? "buy"
                  : trade.sellerId === user?.userId
                  ? "sell"
                  : trade.buyerId != null
                  ? "sell"
                  : "buy",
              buyerId: trade.buyerId,
              sellerId: trade.sellerId,
              quantity: trade.quantity,
              price: trade.price,
              status: trade.status,
              timeStamp: trade.timePlaced,
            }))
            .sort(
              (a: any, b: any) =>
                new Date(b.timeStamp).valueOf() -
                new Date(a.timeStamp).valueOf()
            )
        );
        const inProgress = trades.find(
          (trade: any) => trade.status.toLowerCase() === "in_progress"
        );
        if (inProgress) {
          router.push(`/transfer/${inProgress.tradeId}`);
        }
      })
      .catch(console.error);
  };

  const [socket, setSocket] = useState(() => {
    const socket = io(`${process.env.NEXT_PUBLIC_BACKEND_URL}`, {
      reconnectionDelayMax: 10000,
    });

    socket.on("updateTrades", updateTrades);

    return socket;
  });

  useEffect(updateTrades, [logOutUser, user, setTradeHistory]);

  const rows = tradeHistory.map((trade) => (
    <tr key={trade.id}>
      <td>
        <Badge color={trade.type === "buy" ? "blue" : "red"}>
          {trade.type}
        </Badge>
      </td>
      <td>{trade.quantity}</td>
      <td>{trade.price}</td>
      <td>
        <Badge
          color={
            trade.status.toLowerCase() === "completed"
              ? "green"
              : trade.status.toLowerCase() === "pending"
              ? "yellow"
              : "red"
          }
        >
          {trade.status}
        </Badge>
      </td>
      <td>{new Date(trade.timeStamp).toLocaleString()}</td>
      <td>
        {trade.status.toLowerCase() === "pending" ? (
          trade.buyerId === user?.userId || trade.sellerId === user?.userId ? (
            <Button
              color="red"
              size="xs"
              onClick={() => {
                fetch(
                  `${process.env.NEXT_PUBLIC_BACKEND_URL}/trades/cancel/${trade.id}`,
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
              disabled={ethereum == null}
            >
              Cancel
            </Button>
          ) : (
            <Button
              color="green"
              size="xs"
              onClick={() => {
                fetch(
                  `${process.env.NEXT_PUBLIC_BACKEND_URL}/trades/accept-${trade.type}/${trade.id}`,
                  {
                    method: "PUT",
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
              disabled={ethereum == null}
            >
              Accept
            </Button>
          )
        ) : (
          ""
        )}
      </td>
    </tr>
  ));
  return (
    <div className="mt-8">
      <h2 className="text-2xl font-semibold m-0">Trade History</h2>
      <div className="bg-white rounded p-2 mt-2 shadow-xl border border-solid border-gray-200">
        <Table>
          <thead>
            <tr>
              <th>Type</th>
              <th>Quantity (WHr)</th>
              <th>Price (ETH)</th>
              <th>Status</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>{rows}</tbody>
        </Table>
      </div>
    </div>
  );
};

export default TradeHistory;
