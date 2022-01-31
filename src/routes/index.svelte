<script context="module">
	export const prerender = true;
</script>
<script>
import { onMount } from "svelte";
import dayjs from "dayjs";
import buildPairs from "$lib/pairs";
import buildProfitFunc from "$lib/profit";

import socketSubscribe from "$lib/socket";

import ResultsTable from "$lib/winners-table.svelte";
import DetailModal from "$lib/detail.svelte";

let modalDetail = false;
let contentModal = {};
let FEE = 750;

const showPopupLong = e => {

  modalDetail = true;
  contentModal = e;

};

const info = {
  pairslen: 0,
  msgcount: 0,
  cycleschecked: 0,
  cyclescheckedPerSecond: 0,
  currentStatus: "",
}
let oldWinners = null;
let winners = [];
let tops = [];

let checkProfit;
let tick;

// const INTERVAL = 5000;
const INTERVAL = 50;

onMount( async () => {
  const socket = await socketSubscribe();
  const { hashMarket, pairs: allPairs } = await buildPairs();

  info.currentStatus = "Connecting to binance";

  info.pairslen = allPairs.length;
  info.socket = socket;
  setInterval( () => {

    info.msgcount = socket.msgcount;
    socket.msgcount = 0;
    info.cyclescheckedPerSecond = info.cycleschecked;
    info.cycleschecked = 0;

  }, 1000 )

  checkProfit = await buildProfitFunc();

  tick = function tick() {

    if ( info.currentStatus === "Connecting to binance" ) {

      if ( info.msgcount > 0 ) {

        info.currentStatus = "Working";

      }

    } else {

      info.currentStatus = "Working";

    }

    const startTime = +new Date();
    const uPair = socket.pairupdate;
    const markets = socket.m;

    socket.pairupdate = [];

    let pairsToTest = uPair.map( pair => hashMarket[ pair ] ).flat()
    pairsToTest = [ ...new Set( pairsToTest ) ].map( id => allPairs[ id ] ).filter( e => e );

    if ( ! pairsToTest.length ) {

      setTimeout( tick, 50 );
      return;

    }

    // voy con todos!
    // const pairsToTest = allPairs.filter(p => intersect(p, u).length)

    let ret;
    try {

      info.cycleschecked += pairsToTest.length;
      ret = checkProfit( pairsToTest, markets );
      ret.sort( ( a, b ) => b.profit.sub( a.profit ) )

      const w = ret.filter( e => e.profit.gt( 1 ) );
      if ( w.length ) {

        winners = w;
        console.log( winners );
        w.forEach( e => {

          e.time = dayjs().format();

          for ( let k = 0; k < ( e.length - 1 ); k += 1 ) {

            delete socket.m[ e[ k ] + "/" + e[ k + 1 ] ];
            delete socket.m[ e[ k + 1 ] + "/" + e[ k ] ];

          }

        } );

      }

    } catch ( err ) {

      console.error( err )
      console.log( pairsToTest )

    }

    console.log( "cycle", +new Date() - startTime, "ms" )
    if ( winners.length ) {

      info.currentStatus = "Found profitable cycles, halt for 30 seconds";
      // halt 30 seconds
      setTimeout( () => {

        info.currentStatus = "Working";
        oldWinners = winners;
        winners = [];
        tick();

      }, 1000 * 30 )
      return;

    }

    tops = ret
      .slice( 0, 10 );

    setTimeout( tick, INTERVAL )

  }
  setTimeout( tick, 1000 );
  return () => {}

});

$: if(checkProfit && tick) {
  checkProfit.FEE = (FEE/1000000).toFixed(6);
}

</script>

<main>
	<h1>Binance triangular arbitrage in real time</h1>
	<h1><small>find market imperfections easily!<small> <a class="github-button" href="https://github.com/eugenioclrc/binance-crypto-triangular-arbitrage" data-icon="octicon-star" aria-label="Star eugenioclrc/binance-crypto-triangular-arbitrage on GitHub">Star</a></h1>

	<p>
		Triangular arbitrage is the act of exploiting an arbitrage opportunity resulting from a pricing discrepancy among three different currencies. A triangular arbitrage strategy involves three trades, exchanging the initial currency for a second, the second currency for a third, and the third currency for the initial. During the second trade, the arbitrageur locks in a zero-risk profit from the discrepancy that exists when the market cross exchange rate is not aligned with the implicit cross exchange rate. A profitable trade is only possible if there exist market imperfections. Profitable triangular arbitrage is very rarely possible because when such opportunities arise, traders execute trades that take advantage of the imperfections and prices adjust up or down until the opportunity disappears.[6]

	<p><b>Want to help me?</b> please register your binance account using my referral link visit
	<a href="https://www.binance.com/en/register?ref=Q952PPIF">https://www.binance.com/en/register</a></p>


	Total combinations: {info.pairslen} pairs<br >
	Socket updates per second: {info.msgcount}<br />
	Cycles checked per second: {info.cyclescheckedPerSecond}<br />

	<big>
		Current status<br>
		<b>{info.currentStatus}</b><br />
	</big>


	<a class="github-button" href="https://github.com/eugenioclrc/binance-crypto-triangular-arbitrage" data-icon="octicon-star" aria-label="Star eugenioclrc/binance-crypto-triangular-arbitrage on GitHub">Star</a>
  {#if checkProfit}
  
    <blockquote class="shadow mx-auto w-2/3 bg-white p-4 my-2">
      Trades profit are calculate on a base budget of {checkProfit.BASE_USD_BUDGET}USD and a {checkProfit.FEE * 100}% fee
    </blockquote>
    <div>
      {FEE/10000}% <br />
      <input type="range" bind:value={FEE} min="0" max="10000" step="1">
      

      <!-- Value: {(FEE/1000000).toFixed(4)} -->
    </div>

  {/if}
	<h2>WINNERS</h2>
	{#if ! winners.length}
		<b>No winner pair yet</b>
	{:else}
		<ResultsTable results={winners} />
	{/if}


	{#if tops.length}
	<h2>Pairs</h2>
	<table class="styled-table pairs-table">
		<thead>
			<th>Pairs cycle</th>
			<th>Profit (BNB Fess included)</th>
		</thead>
		<tbody>
			{#each tops as t}
			<tr class="cursor-pointer" on:click={() => showPopupLong( t )}>
				<td style="min-width: 295px;">
					{@html t.chain.join( " &rarr; " )}
				</td>
				<td>
					<pre>{t.profit.sub(1).mul(100).toFixed( 4 )}% &#9432;</pre>
				</td>
				</tr>
			{/each}
		</tbody>
	</table>
	{/if}
  
	{#if oldWinners && oldWinners.length}
		<h2>PREV CYCLE WINNERS</h2>
		<ResultsTable results={oldWinners} />
	{/if}
</main>
{#if modalDetail}
	<DetailModal on:close={() => modalDetail = false}>
		<ResultsTable results={[ contentModal ]} />
	</DetailModal>
{/if}

<style>
	table {
		margin: auto;
	}
	main {
		text-align: center;
		padding: 1em;
		max-width: 240px;
		margin: 0 auto;
	}

	h1 {
		color: #ff3e00;
		/* @apply text-orange-600; */
		text-transform: uppercase;
		font-size: 2em;
		font-weight: 400;
	}

	@media (min-width: 640px) {
		main {
			max-width: none;
		}
	}

</style>