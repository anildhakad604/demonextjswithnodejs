BEGIN TRY

BEGIN TRAN;

-- AlterTable
ALTER TABLE [dbo].[OrderItem] ADD [size] NVARCHAR(1000);

-- AlterTable
ALTER TABLE [dbo].[StockMovement] ADD [productSizeId] NVARCHAR(1000);

-- CreateTable
CREATE TABLE [dbo].[ProductSize] (
    [id] NVARCHAR(1000) NOT NULL,
    [productId] NVARCHAR(1000) NOT NULL,
    [size] NVARCHAR(1000) NOT NULL,
    [stock] INT NOT NULL CONSTRAINT [ProductSize_stock_df] DEFAULT 0,
    CONSTRAINT [ProductSize_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [ProductSize_productId_size_key] UNIQUE NONCLUSTERED ([productId],[size])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [ProductSize_productId_idx] ON [dbo].[ProductSize]([productId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [StockMovement_productSizeId_idx] ON [dbo].[StockMovement]([productSizeId]);

-- AddForeignKey
ALTER TABLE [dbo].[ProductSize] ADD CONSTRAINT [ProductSize_productId_fkey] FOREIGN KEY ([productId]) REFERENCES [dbo].[Product]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[StockMovement] ADD CONSTRAINT [StockMovement_productSizeId_fkey] FOREIGN KEY ([productSizeId]) REFERENCES [dbo].[ProductSize]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
