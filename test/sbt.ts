import { loadFixture } from '@nomicfoundation/hardhat-network-helpers'
import { anyValue } from '@nomicfoundation/hardhat-chai-matchers/withArgs'
import { expect } from 'chai'
import { ethers } from 'hardhat'
import { PromiseOrValue } from '../typechain-types/common'
import { SBT } from '../typechain-types'

const tokenID0 = 0
const tokenID1 = 1
const baseURI = 'http://localhost/'

let sbt: SBT
let issuerAccount: { address: PromiseOrValue<string> }
let ownerAccount: { address: PromiseOrValue<string> }
let otherAccount: { address: PromiseOrValue<string> }

describe('SBT', async function () {
  beforeEach(async () => {
    const sbtContract = await ethers.getContractFactory('SBT')
    const sbtName = 'SBT'
    const sbtSymbol = 'SBT'
    const kycLevel = 1
    sbt = await sbtContract.deploy(sbtName, sbtSymbol, baseURI, kycLevel)
    ;[issuerAccount, ownerAccount, otherAccount] = await ethers.getSigners() 
    await sbt.safeMint(ownerAccount.address, tokenID0)
  })

  it('#1 Should mint single SBT', async function () {
    expect(await sbt.balanceOf(ownerAccount.address)).to.equal(1)
    expect(await sbt.tokenURI(0)).to.equal(baseURI + '0')
  })

  it('#2 Shoud fail minting twice with same address', async function () {
    await expect(sbt.safeMint(ownerAccount.address, tokenID1)).to.be.revertedWith('MNT01')
  })

  it('#3 Shoud fail minting twice with same tokenID', async function () {
    await expect(sbt.safeMint(otherAccount.address, tokenID0)).to.be.revertedWith('MNT02')
  })

  it('#4 Locked status should be True', async function () {
    const lockStatus = await sbt.locked(tokenID0)
    expect(lockStatus == true)
  })

  it('#5 Locked status should be reverted not minted tokenID', async function () {
    await expect(sbt.locked(tokenID1)).to.be.reverted
  })

  it('#6 transferFrom should revert', async function () {
    await expect(sbt.transferFrom(ownerAccount.address, otherAccount.address, tokenID0)).to.be
      .reverted
  })

  it('#7 safeTransferFrom(address,address,uint256) should revert', async function () {
    await expect(
      sbt['safeTransferFrom(address,address,uint256)'](
        ownerAccount.address,
        otherAccount.address,
        tokenID0
      )
    ).to.be.reverted
  })

  it('#8 safeTransferFrom(address,address,uint256,bytes) should revert', async function () {
    await expect(
      sbt['safeTransferFrom(address,address,uint256,bytes)'](
        ownerAccount.address,
        otherAccount.address,
        tokenID0,
        []
      )
    ).to.be.reverted
  })

  // To aid recognition that an EIP-721 token implements "soulbinding" via this EIP upon calling EIP-721's
  // function supportsInterface(bytes4 interfaceID) must return true.
  // TODO To be sure interfaceID working right
  it('#9 Check recognition of Soulbinding', async function () {
    const interfaceId = '0xb45a3c0e'
    const checkStatus = await sbt.supportsInterface(interfaceId)
    expect(checkStatus == true)
  })

  it('#10 Check BurnAuth must be 2(Both)', async function() {
    const burnAuth = await sbt.burnAuth(tokenID0)
    expect(burnAuth).to.equals(2)
  })

  it('#11 revoke(uint256) from none issuer should be reverted', async function() {
    const owner = await ethers.getSigner(ownerAccount.address.toString())
    await expect(
      sbt.connect(owner).revoke(tokenID0)
    ).to.be.reverted
  })

  it('#12 burn(uint256) from issuer should be reverted', async function() {
    const issuer = await ethers.getSigner(issuerAccount.address.toString())
    await expect(
      sbt.connect(issuer).burn(tokenID0)
    ).to.be.reverted
  })

  it('#13 Should revoke(uint256) from issuer', async function() {
    await sbt.revoke(tokenID0)
    expect(await sbt.balanceOf(ownerAccount.address)).to.equal(0)
    await expect(sbt.burnAuth(tokenID0)).to.be.reverted
  })

  it('#14 Should burn(uint256) from owner', async function() {
    const owner = await ethers.getSigner(ownerAccount.address.toString())
    await sbt.connect(owner).burn(tokenID0)
    expect(await sbt.balanceOf(ownerAccount.address)).to.equal(0)
    await expect(sbt.burnAuth(tokenID0)).to.be.reverted
  })

})
