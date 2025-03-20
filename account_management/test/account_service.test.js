const chai = require("chai");
const chaiHttp = require("chai-http");
const sinon = require("sinon");
const { app } = require("../server"); // Import the Express app
const connectDB = require("../src/config/postgresql_connect"); // Import DB connection
const AccountStub = require("../src/models/accountModel");

chai.use(chaiHttp);
const { expect } = chai;

describe("Account Service Tests", () => {
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
        dbStub = sinon.stub(AccountStub, "create");
        dbStub.resolves({ rows: [{ id: 1, name: "John Doe", balance: 1000 }] });
        const res = await chai.request(app).post("/api/accounts/")
            .send({
                name: "John Doe",
                balance: 1000,
            });

        expect(res).to.have.status(401);
        dbStub.restore();
    });

    it("should stop user with invalid token", async () => {
        dbStub = sinon.stub(AccountStub, "create");
        dbStub.resolves({ rows: [{ id: 1, name: "John Doe", balance: 1000 }] });
        const res = await chai.request(app).post("/api/accounts/")
            .set({ 'Authorization': 'Bearer wrongToken' })
            .send({
                name: "John Doe",
                balance: 1000,
            });

        expect(res).to.have.status(403);
        dbStub.restore();
    });

    it("should create a new account", async () => {
        dbStub = sinon.stub(AccountStub, "create");
        dbStub.resolves({ rows: [{ id: 1, name: "John Doe", balance: 1000 }] });
        const res = await chai.request(app).post("/api/accounts/")
            .set({ 'Authorization': 'Bearer ' + token })
            .send({
                name: "John Doe",
                balance: 1000,
            });

        expect(res).to.have.status(201);
        expect(res.body).to.have.property("success").eq(true);
        dbStub.restore();
    });

    it("should capture error thrown while creating a new account", async () => {
        dbStub = sinon.stub(AccountStub, "create").throwsException();
        const res = await chai.request(app).post("/api/accounts/")
            .set({ 'Authorization': 'Bearer ' + token })
            .send({
                name: "John Doe",
                balance: 1000,
            });

        expect(res).to.have.status(500);
        expect(res.body).to.have.property("success").eq(false);
        dbStub.restore();
    });

    it("should retrieve an account by ID", async () => {
        dbStub = sinon.stub(AccountStub, "findByPk");
        dbStub.resolves({ rows: [{ id: 1, name: "John Doe", balance: 1000 }] });
        const res = (await chai.request(app).get("/api/accounts/1").set({ 'Authorization': 'Bearer ' + token }));
        expect(res).to.have.status(200);
        expect(res.body).to.have.property("success").eq(true);
        dbStub.restore();
    });

    it("should capture error thrown while retrieving account details", async () => {
        dbStub = sinon.stub(AccountStub, "findByPk").throwsException();
        const res = (await chai.request(app).get("/api/accounts/1").set({ 'Authorization': 'Bearer ' + token }));
        expect(res).to.have.status(500);
        expect(res.body).to.have.property("success").eq(false);
        dbStub.restore();
    });

    it("should retrieve all accounts for a user by ID", async () => {
        dbStub = sinon.stub(AccountStub, "findAll");
        dbStub.resolves({ rows: [{ id: 1, name: "John Doe", balance: 1000 }] });
        const res = (await chai.request(app).get("/api/accounts").set({ 'Authorization': 'Bearer ' + token }));
        expect(res).to.have.status(200);
        expect(res.body).to.have.property("success").eq(true);
        dbStub.restore();
    });

    it("should handle no accounts for userID", async () => {
        dbStub = sinon.stub(AccountStub, "findAll");
        dbStub.resolves([]);
        const res = (await chai.request(app).get("/api/accounts").set({ 'Authorization': 'Bearer ' + token }));
        expect(res).to.have.status(404);
        dbStub.restore();
    });

    it("should capture error while retrieve all accounts for user", async () => {
        dbStub = sinon.stub(AccountStub, "findAll").throwsException();
        const res = (await chai.request(app).get("/api/accounts").set({ 'Authorization': 'Bearer ' + token }));
        expect(res).to.have.status(500);
        expect(res.body).to.have.property("success").eq(false);
        dbStub.restore();
    });

    it("should update balance of an account for deposit", async () => {
        dbStub = sinon.stub(AccountStub, "findByPk");
        dbStub.resolves({ id: 1, name: "John Doe", balance: 1000, save: sinon.stub() });
        const res = await chai.request(app).put("/api/accounts/balance")
            .set({ 'Authorization': 'Bearer ' + token })
            .send({
                account_id: 1,
                transaction_type: "DEPOSIT",
                amount: 1000,
            });

        expect(res).to.have.status(200);
        expect(res.body).to.have.property("success").eq(true);
        dbStub.restore();
    });

    it("should update balance of an account for withdrawal", async () => {
        dbStub = sinon.stub(AccountStub, "findByPk");
        dbStub.resolves({ id: 1, name: "John Doe", balance: 1000, save: sinon.stub() });
        const res = await chai.request(app).put("/api/accounts/balance")
            .set({ 'Authorization': 'Bearer ' + token })
            .send({
                account_id: 1,
                transaction_type: "WITHDRAWAL",
                amount: 100,
            });

        expect(res).to.have.status(200);
        expect(res.body).to.have.property("success").eq(true);
        dbStub.restore();
    });

    it("should update balance for withdrawal with insufficient balance ", async () => {
        dbStub = sinon.stub(AccountStub, "findByPk");
        dbStub.resolves({ id: 1, name: "John Doe", balance: 1000, save: sinon.stub() });
        const res = await chai.request(app).put("/api/accounts/balance")
            .set({ 'Authorization': 'Bearer ' + token })
            .send({
                account_id: 1,
                transaction_type: "WITHDRAWAL",
                amount: 10000,
            });

        expect(res).to.have.status(400);
        expect(res.body).to.have.property("success").eq(false);
        dbStub.restore();
    });

    it("should update balance of an account for transfer", async () => {
        dbStub = sinon.stub(AccountStub, "findByPk");
        dbStub.resolves({ id: 1, name: "John Doe", balance: 1000, save: sinon.stub() });
        const res = await chai.request(app).put("/api/accounts/balance")
            .set({ 'Authorization': 'Bearer ' + token })
            .send({
                account_id: 1,
                recipient_account_id: 2,
                transaction_type: "TRANSFER",
                amount: 100,
            });

        expect(res).to.have.status(200);
        expect(res.body).to.have.property("success").eq(true);
        dbStub.restore();
    });

    it("should capture error thrown while updating balance for invalid account", async () => {
        dbStub = sinon.stub(AccountStub, "findByPk").throwsException;
        const res = await chai.request(app).put("/api/accounts/balance")
            .set({ 'Authorization': 'Bearer ' + token })
            .send({
                account_id: 1,
                transaction_type: "DEPOSIT",
                amount: 1000,
            });

        expect(res).to.have.status(404);
        expect(res.body).to.have.property("success").eq(false);
    });
});