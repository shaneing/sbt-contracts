import { loadFixture } from '@nomicfoundation/hardhat-network-helpers'
import { anyValue } from '@nomicfoundation/hardhat-chai-matchers/withArgs'
import { expect } from 'chai'
import { ethers } from 'hardhat'
import { PromiseOrValue } from '../typechain-types/common'
import { KYC } from '../typechain-types'
import { SBT } from '../typechain-types'

const tokenID0 = 0
const tokenID1 = 1
const baseURI = 'http://localhost/'

let kyc: KYC
let sbt: SBT
let ownerAccount: { address: PromiseOrValue<string> }
let otherAccount: { address: PromiseOrValue<string> }

describe('kyc', async function () {
  beforeEach(async () => {
    const sbtContract = await ethers.getContractFactory('SBT')
    const kycContract = await ethers.getContractFactory('KYC')
    sbt = await sbtContract.deploy('SBT', 'SBT', baseURI)
    kyc = await kycContract.deploy(sbt.address)
    ;[ownerAccount, otherAccount] = await ethers.getSigners()
    await sbt.safeMint(ownerAccount.address, tokenID0)
  })

  it('#1 Should passed for KYC account', async function () {
    const owner = await ethers.getSigner(ownerAccount.address.toString())
    await kyc.connect(owner).inc()
    expect(await kyc.getCount()).to.equal(1)
  })

  it('#2 Should failed for no KYC account', async function () {
    const other = await ethers.getSigner(otherAccount.address.toString())
    await expect(kyc.connect(other).inc()).to.be.revertedWith('No KYC')
  })

})
