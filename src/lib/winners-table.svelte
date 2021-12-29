<script>
export let results = [];

</script>
{#each results as w, i}
  <p>
    <b>#{i + 1}</b> {@html w.chain.join( " &rarr; " )}<br>
    <small>Time found: {w.time}</small>
  </p>

  <div class="instructions">
    <table class="styled-table">
      <thead>
        <tr>
          <th>Side</th>
          <th>Market</th>
          <th>Price</th>
          <th>Amount</th>
          <th>Total</th>
        </tr>
      </thead>
      <tbody>
      {#each w.orders as o,j}
        <tr>
          <td>
            {#if o.side === "buy"}
            <b style="color: #02c076">BUY</b>
            {:else}
            <b style="color: #f84960">SELL</b>
            {/if}
          </td>
          <td><a href={o.link} target="_blank">{o.market}</a></td>
          <td>{o.price} <small style="font-weight: bold">{o.market.split( "/" )[ 1 ]}</small></td>
          <td>{o.amount} <small style="font-weight: bold">{o.market.split( "/" )[ 0 ]}</small></td>
          <td>{o.total} <small style="font-weight: bold">{o.market.split( "/" )[ 1 ]}</small></td>
        </tr>
      {/each}
      </tbody>
    </table>
    <p>
    {#each w.orders as o,j}
      {j + 1}.
        {#if o.side === "buy"}
          Use {o.total} <small style="font-weight: bold">{o.market.split( "/" )[ 1 ]}</small>
          to <b style="color: #02c076">BUY</b> {o.amount} <small style="font-weight: bold">{o.market.split( "/" )[ 0 ]}</small>
          in market <a href={o.link} target="_blank">{o.market}</a> @{o.price} <small style="font-weight: bold">{o.market.split( "/" )[ 1 ]}</small>
        {:else}
          <b style="color:#f84960">SELL</b> {o.amount} <small style="font-weight: bold">{o.market.split( "/" )[ 0 ]}</small>
          to get {o.total} <small style="font-weight: bold">{o.market.split( "/" )[ 1 ]}</small>
          in market <a href={o.link} target="_blank">{o.market}</a> @{o.price} <small style="font-weight: bold">{o.market.split( "/" )[ 1 ]}</small>
        {/if}
      <br />
    {/each}
    <br />
    Total profit (counting all binance BNB fees) {w.profit.sub( 1 ).mul( 100 ).toFixed( 4 )}%
    <br />
  </p>
  <hr/>
  </div>
{/each}
