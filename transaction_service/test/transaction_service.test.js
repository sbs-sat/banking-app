const chai = require("chai");
const chaiHttp = require("chai-http");
const sinon = require("sinon");
const { app } = require("../server"); // Import the Express app
const connectDB = require("../src/config/mongo_connect"); // Import DB connection
const TransactionStub = require("../src/models/transactionModel");
const axios = require("axios");

chai.use(chaiHttp);
const { expect } = chai;

describe("Transaction Service Tests", () => {
    let dbStub;
    let token;

    beforeEach(() => {
        console.log("In beforeEach() method ::::::: ");

    });

    afterEach(() => {
    });

    it("should register new user", async () => {
        const res = await chai.request(app).post("/register").send({ "username": "testuser", "password": "testpassword" });
        expect(res).to.have.status(200);
        expect(res.body).to.have.property("message");
    });

    it("should login registered user", async () => {
        const res = await chai.request(app).post("/login").send({ "username": "testuser", "password": "testpassword" });
        expect(res).to.have.status(200);
        expect(res.body).to.have.property("token");
        token = res.body.token;
    });

    it("should stop login for invalid credentials", async () => {
        const res = await chai.request(app).post("/login").send({ "username": "testuser", "password": "wrongpassword" });
        expect(res).to.have.status(403);
    });

    it("should stop calls without token", async () => {
        dbStub = sinon.stub(TransactionStub, "create");
        dbStub.resolves({ rows: [{ id: 1, name: "John Doe", balance: 1000 }] });
        const res = await chai.request(app).post("/api/transactions/")
            .send({
                name: "John Doe",
                balance: 1000,
            });

        expect(res).to.have.status(401);
        dbStub.restore();
    });

    it("should stop user with invalid token", async () => {
        dbStub = sinon.stub(TransactionStub, "create");
        dbStub.resolves({ rows: [{ id: 1, name: "John Doe", balance: 1000 }] });
        const res = await chai.request(app).post("/api/transactions/")
            .set({ 'Authorization': 'Bearer wrongToken' })
            .send({
                name: "John Doe",
                balance: 1000,
            });

        expect(res).to.have.status(403);
        dbStub.restore();
    });

    it("should capture error for invalid amount while creating transaction", async () => {
        dbStub = sinon.stub(TransactionStub, "create");
        dbStub.resolves({ rows: [{ account_id: 1, transaction_type: "DEPOSIT", amount: 1000 }], save: sinon.stub() });
        const res = await chai.request(app).post("/api/transactions/")
            .set({ 'Authorization': 'Bearer ' + token })
            .send({
                account_id: 1,
                transaction_type: "DEPOSIT",
                amount: 0,
            });

        expect(res).to.have.status(400);
        dbStub.restore();
    });

    it("should create a new transaction", async () => {
        dbStub = sinon.stub(TransactionStub, "create");
        dbStub.resolves({ rows: [{ account_id: 1, transaction_type: "DEPOSIT", amount: 1000 }], save: sinon.stub() });
        let axiosStub = sinon.stub(axios, "put");
        axiosStub.resolves({ data: { success: true } });
        const res = await chai.request(app).post("/api/transactions/")
            .set({ 'Authorization': 'Bearer ' + token })
            .send({
                account_id: 1,
                transaction_type: "DEPOSIT",
                amount: 1000,
            });
        expect(res).to.have.status(201);
        dbStub.restore();
        axiosStub.restore();
    });

    it("should capture the failure to update account balance while creating new transaction", async () => {
        dbStub = sinon.stub(TransactionStub, "create");
        dbStub.resolves({ rows: [{ account_id: 1, transaction_type: "DEPOSIT", amount: 1000 }], save: sinon.stub() });
        let axiosStub = sinon.stub(axios, "put");
        axiosStub.resolves({ data: { success: false } });
        const res = await chai.request(app).post("/api/transactions/")
            .set({ 'Authorization': 'Bearer ' + token })
            .send({
                account_id: 1,
                transaction_type: "DEPOSIT",
                amount: 1000,
            });
        expect(res).to.have.status(400);
        dbStub.restore();
        axiosStub.restore();
    });

    it("should capture error while updating account balance for new transaction", async () => {
        dbStub = sinon.stub(TransactionStub, "create");
        dbStub.resolves({ rows: [{ account_id: 1, transaction_type: "DEPOSIT", amount: 1000 }], save: sinon.stub() });
        let axiosStub = sinon.stub(axios, "put");
        axiosStub.throwsException();
        const res = await chai.request(app).post("/api/transactions/")
            .set({ 'Authorization': 'Bearer ' + token })
            .send({
                account_id: 1,
                transaction_type: "DEPOSIT",
                amount: 1000,
            });
        expect(res).to.have.status(500);
        dbStub.restore();
        axiosStub.restore();
    });

    it("should retrieve transaction details by ID", async () => {
        dbStub = sinon.stub(TransactionStub, "findById");
        dbStub.resolves({ rows: [{ transaction_id: 1, transaction_type: "DEPOSIT", amount: 1000 }] });
        const res = (await chai.request(app).get("/api/transactions/1").set({ 'Authorization': 'Bearer ' + token }));
        expect(res).to.have.status(200);
        expect(res.body).to.have.property("success").eq(true);
        dbStub.restore();
    });

    it("should capture error thrown while retrieving transaction details", async () => {
        dbStub = sinon.stub(TransactionStub, "findById").throwsException();
        const res = (await chai.request(app).get("/api/transactions/1").set({ 'Authorization': 'Bearer ' + token }));
        expect(res).to.have.status(500);
        expect(res.body).to.have.property("success").eq(false);
        dbStub.restore();
    });

    it("should retrieve all transactions for a acount_iD", async () => {
        dbStub = sinon.stub(TransactionStub, "find");
        dbStub.resolves({ rows: [{ transaction_id: 1, transaction_type: "DEPOSIT", amount: 1000 }] });
        const res = (await chai.request(app).get("/api/transactions/account/1").set({ 'Authorization': 'Bearer ' + token }));
        expect(res).to.have.status(200);
        expect(res.body).to.have.property("success").eq(true);
        dbStub.restore();
    });

    it("should capture error while retrieve all transactions for account", async () => {
        dbStub = sinon.stub(TransactionStub, "find").throwsException();
        const res = (await chai.request(app).get("/api/transactions/account/1").set({ 'Authorization': 'Bearer ' + token }));
        expect(res).to.have.status(500);
        expect(res.body).to.have.property("success").eq(false);
        dbStub.restore();
    });

});