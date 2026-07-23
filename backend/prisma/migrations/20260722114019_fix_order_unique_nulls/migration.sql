BEGIN TRY

BEGIN TRAN;

-- DropIndex
ALTER TABLE [dbo].[Order] DROP CONSTRAINT [Order_razorpayOrderId_key];

-- DropIndex
ALTER TABLE [dbo].[Order] DROP CONSTRAINT [Order_razorpayPaymentId_key];

-- CreateIndex
CREATE NONCLUSTERED INDEX [Order_razorpayOrderId_idx] ON [dbo].[Order]([razorpayOrderId]);

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
