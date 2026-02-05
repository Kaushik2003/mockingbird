# CoinStats API

API endpoints for interacting with CoinStats cryptocurrency data services.

## Market Data

### Get Coins
`GET` `/coins`

Retrieve information about available cryptocurrencies.

### Get Coins Charts
`GET` `/coins/charts`

Get historical price charts for multiple coins.

### Get Coin By Id
`GET` `/coins/{id}`

Retrieve detailed information about a specific coin by its ID.

### Get Coin Chart By Id
`GET` `/coins/{id}/chart`

Get historical price chart data for a specific coin.

### Get Coin Avg Price
`GET` `/coins/{id}/avg-price`

Get the average price of a coin over a specified time period.

### Get Coin Exchange Price
`GET` `/coins/{id}/exchange-price`

Get the current exchange price of a coin.

### Get Ticker Exchanges
`GET` `/ticker/exchanges`

Retrieve ticker data from various exchanges.

### Get Ticker Markets
`GET` `/ticker/markets`

Get ticker information from different markets.

### Get Fiat Currencies
`GET` `/fiats`

Retrieve a list of supported fiat currencies.

### Get Market Cap
`GET` `/market-cap`

Get market capitalization data.

### Get Currencies
`GET` `/currencies`

Retrieve information about available currencies.

## Wallet Data

### Get Blockchains
`GET` `/blockchains`

Retrieve information about supported blockchain networks.

### Get Wallet Balance
`GET` `/wallet/{address}/balance`

Get the balance of a specific wallet address.

### Get Wallet Balances
`GET` `/wallet/{address}/balances`

Get token balances for a specific wallet address.

### Get Wallet Sync Status
`GET` `/wallet/{address}/sync-status`

Check the synchronization status of a wallet.

### Get Wallet Transactions
`GET` `/wallet/{address}/transactions`

Retrieve transaction history for a wallet.

### Transactions Sync
`PATCH` `/wallet/{address}/transactions/sync`

Trigger a synchronization of wallet transactions.

### Wallet Chart
`GET` `/wallet/{address}/chart`

Get wallet value chart data over time.

### Wallet Charts
`GET` `/wallet/{address}/charts`

Get multiple chart types for a wallet.

### Get Wallet DeFi
`GET` `/wallet/{address}/defi`

Retrieve DeFi position data for a wallet.

## Exchange Connection

### Get Exchanges
`GET` `/exchanges`

Retrieve a list of supported exchanges.

### Get Exchange Balance
`POST` `/exchange/balance`

Get balance from a connected exchange account.

### Get Exchange Sync Status
`GET` `/exchange/sync-status`

Check the synchronization status of an exchange connection.

### Get Exchange Transactions
`GET` `/exchange/transactions`

Retrieve transaction history from a connected exchange.

### Get Exchange Chart
`GET` `/exchange/chart`

Get exchange balance chart data over time.

### Exchange Sync Status
`PATCH` `/exchange/sync-status`

Trigger synchronization of exchange data.

## NFTs

### Get Trending Nfts
`GET` `/nfts/trending`

Retrieve information about trending NFT collections.

### Get Nfts By Wallet
`GET` `/wallet/{address}/nfts`

Get NFT holdings for a specific wallet address.

### Get Nft Collection By Address
`GET` `/nfts/{address}`

Retrieve information about an NFT collection by contract address.

### Get Nft Collection Assets By Address
`GET` `/nfts/{address}/assets`

Get all assets within an NFT collection.

### Get Nft Collection Asset By Tokenid
`GET` `/nfts/{address}/assets/{tokenId}`

Retrieve a specific NFT from a collection by token ID.

## News

### Get News Sources
`GET` `/news/sources`

Retrieve a list of available news sources.

### Get News
`GET` `/news`

Get the latest cryptocurrency news articles.

### Get News By Type
`GET` `/news/{type}`

Get news articles filtered by type.

### Get News By Id
`GET` `/news/{id}`

Retrieve a specific news article by its ID.

## Portfolio

### Get Portfolio Value
`GET` `/portfolio/value`

Get the total value of a tracked portfolio.

### Get Portfolio Coins
`GET` `/portfolio/coins`

Get coin holdings within a portfolio.

### Get Portfolio Chart
`GET` `/portfolio/chart`

Get portfolio value chart data over time.

### Get Portfolio Transactions
`GET` `/portfolio/transactions`

Retrieve transaction history for a portfolio.

### Add Portfolio Transaction
`POST` `/portfolio/transactions`

Add a new transaction to a portfolio.

### Get Portfolio DeFi
`GET` `/portfolio/defi`

Retrieve DeFi position data for a portfolio.

### Get Portfolio Snapshot Items
`GET` `/portfolio/snapshots`

Get historical portfolio snapshot data.

## Market Insights

### Btc Dominance
`GET` `/insights/btc-dominance`

Get Bitcoin dominance percentage in the crypto market.

### Fear And Greed
`GET` `/insights/fear-greed`

Get the current Fear & Greed Index value.

### Fear And Greed Chart
`GET` `/insights/fear-greed/chart`

Get historical Fear & Greed Index data over time.

### Rainbow Chart
`GET` `/insights/rainbow-chart`

Get the Bitcoin Rainbow Chart data.

## Usage

### Get Credit Usage
`GET` `/usage/credits`

Check API credit usage and remaining credits.