import { getMarketsData } from './exchange';

export default async function subscribe(params = ['!bookTicker']) {
  const marketsData = await getMarketsData();
  const marketsIds = {};
  const marketsIdsR = {};

  Object.keys(marketsData).forEach((m) => {
    marketsIds[marketsData[m].info.symbol] = m;
    marketsIds[m] = marketsData[m].info.symbol;
  });

  let tickersParams = params;
  if (params[0] !== '!bookTicker') {
    tickersParams = params
      .map((e) => marketsIdsR[e])
      .filter((e) => e)
      .map((e) => `${e.toLowerCase()}@bookTicker`);
  }
  const m = {};

  const ret = {
    name: 'binance',
    m,
    socket: '',
    update: [],
    pairupdate: [],
    last: +(new Date()),
    msgcount: 0,
  };

  const last = {};
  function incoming(dataStr) {
    ret.msgcount += 1;
    const data = JSON.parse(dataStr.data);
    if (data.stream && (data.stream.split('@')[1] === 'bookTicker' || data.stream === '!bookTicker')) {
      const {
        u, s, b, a, B, A,
      } = data.data;
      const volBid = parseFloat(B);
      const volAsk = parseFloat(A);
      if (!volBid || !volAsk || !A || !B) {
        delete m[s];
        return;
      }

      ret.last = +(new Date());
      if (last[s] && u < last[s]) {
        // delete m[s]
        return;
      }
      last[s] = u;
      let name = s;
      name = marketsIds[s];

      if (!ret.pairupdate.includes(name)) {
        ret.pairupdate.push(name);
      }

      m[name] = {
        last: ret.last,
        bidPrice: b,
        bidQty: B,
        askPrice: a,
        askQty: A,
      };
    }
  }

  function getSocket() {
    const ws = new WebSocket('wss://stream.binance.com/stream');

    ws.onopen = () => {
      console.log('binance socket connected');
      ws.send(JSON.stringify({ method: 'SUBSCRIBE', params: tickersParams, id: 1 }));
    };

    ws.onmessage = incoming;
    /*
    ws.on('ping', () => {
      ws.pong();
    });

    ret.heartbeat = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.ping();
      }
    }, 5000);
    */
    return ws;
  }

  ret.socket = getSocket();

  ret.socket.onclose = () => {
    Object.keys(ret.m).forEach((item) => {
      delete (ret.m[item]);
    });

    console.log('Binance WebSocket connection disconnected');
    clearInterval(ret.heartbeat);
    setTimeout(() => {
      ret.socket = getSocket();
    }, 100);
  };

  ret.reset = () => {
    ret.socket.close();
  };
  return ret;
}
