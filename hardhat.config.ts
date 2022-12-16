import { HardhatUserConfig, task } from 'hardhat/config'
import '@nomicfoundation/hardhat-toolbox'
import '@nomiclabs/hardhat-web3'
import '@nomiclabs/hardhat-ethers'
import '@nomiclabs/hardhat-ganache'
import dotenv from 'dotenv'

dotenv.config()

const commonConfig = {
  gas: 5_000_000,
  accounts: {
    mnemonic: process.env.MNEMONIC || ''
  }
}

const config: HardhatUserConfig = {
  solidity: '0.8.16',
  networks: {
    localhost: {
      gas: 1_400_000
    },
    ganache: {
      gas: 1_400_000,
      url: 'http://localhost:7545'
    },
    baobab: {
      url: 'https://api.baobab.klaytn.net:8651',
      ...commonConfig,
      gasPrice: 250_000_000_000
    },
    cypress: {
      url: 'https://public-en-cypress.klaytn.net',
      ...commonConfig,
      gasPrice: 250_000_000_000
    }
  }
}

task('address', 'Convert mnemonic to address')
  .addParam('mnemonic', "The account's mnemonic")
  .setAction(async (taskArgs, hre) => {
    const something = hre.ethers.Wallet.fromMnemonic(taskArgs.mnemonic)
    console.log(something.address)
  })

task('balance', "Prints an account's balance")
  .addParam('account', "The account's address")
  .setAction(async (taskArgs, hre) => {
    const account = hre.web3.utils.toChecksumAddress(taskArgs.account)
    const balance = await hre.web3.eth.getBalance(account)
    console.log(hre.web3.utils.fromWei(balance, 'ether'), 'KLAY')
  })

task('deploy', 'Deploy SBT')
  .addParam('name', 'SBT name')
  .addParam('symbol', 'SBT symbol')
  .addParam('baseUri', 'URI (must end with /) that will be used as prefix when returning tokenURI')
  .setAction(async (args, hre) => {
    const sbtContract = await hre.ethers.getContractFactory('SBT')
    const sbt = await sbtContract.deploy(args.name, args.symbol, args.baseUri)
    await sbt.deployed()
    console.log(
      `SBT was deployed to ${hre.network.name} network and can be interacted with at address ${sbt.address}`
    )
  })

task('deployKYC', 'Deploy KYC')
  .addParam('sbtAddress', 'The smart contract address of the SBT')
  .setAction(async (args, hre) => {
    const kycContract = await hre.ethers.getContractFactory('KYC')
    const kyc = await kycContract.deploy(args.sbtAddress)
    await kyc.deployed()
    console.log(
      `KYC was deployed to ${hre.network.name} network and can be interacted with at address ${kyc.address}`
    )
  })

task('mint', 'Mint SBT')
  .addParam('address', 'Address of deployed SBT')
  .addParam('to', 'Address receiving SBT token')
  .addParam('tokenId', 'ID of SBT token that is being minted')
  .setAction(async (args, hre) => {
    const sbt = await hre.ethers.getContractAt('SBT', args.address)
    const [owner] = await hre.ethers.getSigners()
    const tx = await (await sbt.safeMint(args.to, args.tokenId)).wait()
    console.log(tx)
    console.log(`SBT with tokenId ${args.tokenId} was minted for address ${args.to}`)
  })

task('query', 'Query SBT')
  .addParam('address', 'Address of deployed SBT')
  .addParam('owner', "The owner of SBT")
  .setAction(async (args, hre) => {
    console.log(args)
    const sbt = await hre.ethers.getContractAt('SBT', args.address)
    const balance = await sbt.balanceOf(args.owner)
    console.log(balance)
  })

task('queryOwner', 'Query SBT')
  .addParam('address', 'Address of deployed SBT')
  .addParam('tokenId', 'ID of SBT token that is being minted')
  .setAction(async (args, hre) => {
    const sbt = await hre.ethers.getContractAt('SBT', args.address)
    const balance = await sbt.ownerOf(args.tokenId)
    console.log(balance)
  })

task('inc', 'Invoking inc function of smart contract KYC')
  .addParam('address', 'Address of deployed KYC')
  .addParam('signer', 'The signer of transaction')
  .setAction(async (args, hre) => {
    const kyc = await hre.ethers.getContractAt('KYC', args.address)
    const signer = await hre.ethers.getSigner(args.signer)
    await (await kyc.connect(signer).inc()).wait()
  })

task('getCount', 'Invoking getCount function of smart contract KYC')
  .addParam('address', 'Address of deployed KYC')
  .setAction(async (args, hre) => {
    const kyc = await hre.ethers.getContractAt('KYC', args.address)
    const count = await kyc.getCount()
    console.log(count)
  })


export default config
