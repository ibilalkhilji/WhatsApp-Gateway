const {toDataURL} = require("qrcode");
const whatsapp = require("wa-multi-session");
const ValidationError = require("../../utils/error");
const {
    responseSuccessWithMessage,
    responseSuccessWithData,
} = require("../../utils/response");

exports.createSession = async (req, res, next) => {
    try {
        const scan = req.query.scan;
        const sessionName =
            req.body.session || req.query.session || req.headers.session;
        if (!sessionName) {
            throw new Error("Bad Request");
        }
        whatsapp.onQRUpdated(async (data) => {
            if (res && !res.headersSent) {
                const qr = await toDataURL(data.qr);

                // Strip the prefix from the Data URL so we can send binary
                const base64Data = qr.replace(/^data:image\/png;base64,/, "");
                const imgBuffer = Buffer.from(base64Data, "base64");

                if (scan && data.sessionId == sessionName) {
                    res.render("scan", {qr: qr});
                } else {
                    res.writeHead(200, {
                        "Content-Type": "image/png",
                        "Content-Length": imgBuffer.length,
                    });
                    res.end(imgBuffer);

                    /*res.status(200).json(
                        responseSuccessWithData({
                            qr: qr,
                        })
                    );*/
                }
            }
        });
        await whatsapp.startSession(sessionName, {printQR: true});
    } catch (error) {
        next(error);
    }
};
exports.deleteSession = async (req, res, next) => {
    try {
        const sessionName =
            req.body.session || req.query.session || req.headers.session;
        if (!sessionName) {
            throw new ValidationError("session Required");
        }
        whatsapp.deleteSession(sessionName);
        res.status(200).json(responseSuccessWithMessage("Success Deleted " + sessionName));
    } catch (error) {
        next(error);
    }
};
exports.sessions = async (req, res, next) => {
    try {
        const key = req.body.key || req.query.key || req.headers.key;

        // is KEY provided and secured
        if (process.env.KEY && process.env.KEY != key) {
            throw new ValidationError("Invalid Key");
        }

        res.status(200).json(responseSuccessWithData(whatsapp.getAllSession()));
    } catch (error) {
        next(error);
    }
};
