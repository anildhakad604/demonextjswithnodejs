BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[User] (
    [id] NVARCHAR(1000) NOT NULL,
    [name] NVARCHAR(1000) NOT NULL,
    [email] NVARCHAR(1000) NOT NULL,
    [phone] NVARCHAR(1000),
    [passwordHash] NVARCHAR(1000) NOT NULL,
    [role] NVARCHAR(1000) NOT NULL CONSTRAINT [User_role_df] DEFAULT 'USER',
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [User_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [User_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [User_email_key] UNIQUE NONCLUSTERED ([email]),
    CONSTRAINT [User_phone_key] UNIQUE NONCLUSTERED ([phone])
);

-- CreateTable
CREATE TABLE [dbo].[OtpCode] (
    [id] NVARCHAR(1000) NOT NULL,
    [phone] NVARCHAR(1000) NOT NULL,
    [code] NVARCHAR(1000) NOT NULL,
    [expiresAt] DATETIME2 NOT NULL,
    [consumedAt] DATETIME2,
    [attempts] INT NOT NULL CONSTRAINT [OtpCode_attempts_df] DEFAULT 0,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [OtpCode_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [OtpCode_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[RefreshToken] (
    [id] NVARCHAR(1000) NOT NULL,
    [token] NVARCHAR(1000) NOT NULL,
    [userId] NVARCHAR(1000) NOT NULL,
    [expiresAt] DATETIME2 NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [RefreshToken_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [RefreshToken_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [RefreshToken_token_key] UNIQUE NONCLUSTERED ([token])
);

-- CreateTable
CREATE TABLE [dbo].[PasswordResetToken] (
    [id] NVARCHAR(1000) NOT NULL,
    [token] NVARCHAR(1000) NOT NULL,
    [userId] NVARCHAR(1000) NOT NULL,
    [expiresAt] DATETIME2 NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [PasswordResetToken_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [PasswordResetToken_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [PasswordResetToken_token_key] UNIQUE NONCLUSTERED ([token])
);

-- CreateTable
CREATE TABLE [dbo].[Address] (
    [id] NVARCHAR(1000) NOT NULL,
    [userId] NVARCHAR(1000) NOT NULL,
    [fullName] NVARCHAR(1000) NOT NULL,
    [phone] NVARCHAR(1000) NOT NULL,
    [line1] NVARCHAR(1000) NOT NULL,
    [line2] NVARCHAR(1000),
    [city] NVARCHAR(1000) NOT NULL,
    [state] NVARCHAR(1000) NOT NULL,
    [postalCode] NVARCHAR(1000) NOT NULL,
    [country] NVARCHAR(1000) NOT NULL CONSTRAINT [Address_country_df] DEFAULT 'India',
    [isDefault] BIT NOT NULL CONSTRAINT [Address_isDefault_df] DEFAULT 0,
    CONSTRAINT [Address_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[Category] (
    [id] NVARCHAR(1000) NOT NULL,
    [name] NVARCHAR(1000) NOT NULL,
    [slug] NVARCHAR(1000) NOT NULL,
    CONSTRAINT [Category_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Category_name_key] UNIQUE NONCLUSTERED ([name]),
    CONSTRAINT [Category_slug_key] UNIQUE NONCLUSTERED ([slug])
);

-- CreateTable
CREATE TABLE [dbo].[SubCategory] (
    [id] NVARCHAR(1000) NOT NULL,
    [categoryId] NVARCHAR(1000) NOT NULL,
    [name] NVARCHAR(1000) NOT NULL,
    [slug] NVARCHAR(1000) NOT NULL,
    CONSTRAINT [SubCategory_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [SubCategory_categoryId_slug_key] UNIQUE NONCLUSTERED ([categoryId],[slug])
);

-- CreateTable
CREATE TABLE [dbo].[Product] (
    [id] NVARCHAR(1000) NOT NULL,
    [name] NVARCHAR(1000) NOT NULL,
    [slug] NVARCHAR(1000) NOT NULL,
    [skuCode] NVARCHAR(1000) NOT NULL,
    [description] NVARCHAR(1000) NOT NULL,
    [price] DECIMAL(10,2) NOT NULL,
    [actualPrice] DECIMAL(10,2),
    [isFlashSale] BIT NOT NULL CONSTRAINT [Product_isFlashSale_df] DEFAULT 0,
    [isFastDelivery] BIT NOT NULL CONSTRAINT [Product_isFastDelivery_df] DEFAULT 0,
    [colorGroupId] NVARCHAR(1000),
    [colorName] NVARCHAR(1000),
    [colorSwatchHex] NVARCHAR(1000),
    [image] NVARCHAR(1000) NOT NULL,
    [stock] INT NOT NULL CONSTRAINT [Product_stock_df] DEFAULT 0,
    [lowStockThreshold] INT NOT NULL CONSTRAINT [Product_lowStockThreshold_df] DEFAULT 5,
    [isActive] BIT NOT NULL CONSTRAINT [Product_isActive_df] DEFAULT 1,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Product_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    [categoryId] NVARCHAR(1000) NOT NULL,
    [subCategoryId] NVARCHAR(1000),
    CONSTRAINT [Product_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Product_slug_key] UNIQUE NONCLUSTERED ([slug]),
    CONSTRAINT [Product_skuCode_key] UNIQUE NONCLUSTERED ([skuCode])
);

-- CreateTable
CREATE TABLE [dbo].[ProductContentBlock] (
    [id] NVARCHAR(1000) NOT NULL,
    [productId] NVARCHAR(1000) NOT NULL,
    [type] NVARCHAR(1000) NOT NULL,
    [sortOrder] INT NOT NULL CONSTRAINT [ProductContentBlock_sortOrder_df] DEFAULT 0,
    [data] NVARCHAR(max) NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [ProductContentBlock_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [ProductContentBlock_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[ProductImage] (
    [id] NVARCHAR(1000) NOT NULL,
    [productId] NVARCHAR(1000) NOT NULL,
    [url] NVARCHAR(1000) NOT NULL,
    [sortOrder] INT NOT NULL CONSTRAINT [ProductImage_sortOrder_df] DEFAULT 0,
    CONSTRAINT [ProductImage_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[Review] (
    [id] NVARCHAR(1000) NOT NULL,
    [productId] NVARCHAR(1000) NOT NULL,
    [userId] NVARCHAR(1000) NOT NULL,
    [rating] INT NOT NULL,
    [comment] NVARCHAR(1000) NOT NULL,
    [imageUrl] NVARCHAR(1000),
    [isApproved] BIT NOT NULL CONSTRAINT [Review_isApproved_df] DEFAULT 1,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Review_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [Review_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Review_productId_userId_key] UNIQUE NONCLUSTERED ([productId],[userId])
);

-- CreateTable
CREATE TABLE [dbo].[WishlistItem] (
    [id] NVARCHAR(1000) NOT NULL,
    [userId] NVARCHAR(1000) NOT NULL,
    [productId] NVARCHAR(1000) NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [WishlistItem_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [WishlistItem_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [WishlistItem_userId_productId_key] UNIQUE NONCLUSTERED ([userId],[productId])
);

-- CreateTable
CREATE TABLE [dbo].[ProductSize] (
    [id] NVARCHAR(1000) NOT NULL,
    [productId] NVARCHAR(1000) NOT NULL,
    [size] NVARCHAR(1000) NOT NULL,
    [stock] INT NOT NULL CONSTRAINT [ProductSize_stock_df] DEFAULT 0,
    CONSTRAINT [ProductSize_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [ProductSize_productId_size_key] UNIQUE NONCLUSTERED ([productId],[size])
);

-- CreateTable
CREATE TABLE [dbo].[StockMovement] (
    [id] NVARCHAR(1000) NOT NULL,
    [productId] NVARCHAR(1000) NOT NULL,
    [productSizeId] NVARCHAR(1000),
    [change] INT NOT NULL,
    [reason] NVARCHAR(1000) NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [StockMovement_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [StockMovement_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[Coupon] (
    [id] NVARCHAR(1000) NOT NULL,
    [code] NVARCHAR(1000) NOT NULL,
    [discountType] NVARCHAR(1000) NOT NULL,
    [discountValue] DECIMAL(10,2) NOT NULL,
    [minOrderValue] DECIMAL(10,2) NOT NULL CONSTRAINT [Coupon_minOrderValue_df] DEFAULT 0,
    [maxUses] INT,
    [usedCount] INT NOT NULL CONSTRAINT [Coupon_usedCount_df] DEFAULT 0,
    [expiresAt] DATETIME2,
    [isActive] BIT NOT NULL CONSTRAINT [Coupon_isActive_df] DEFAULT 1,
    [offerText] NVARCHAR(1000),
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Coupon_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [Coupon_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Coupon_code_key] UNIQUE NONCLUSTERED ([code])
);

-- CreateTable
CREATE TABLE [dbo].[Banner] (
    [id] NVARCHAR(1000) NOT NULL,
    [type] NVARCHAR(1000) NOT NULL,
    [imageUrl] NVARCHAR(1000) NOT NULL,
    [linkUrl] NVARCHAR(1000),
    [title] NVARCHAR(1000),
    [sortOrder] INT NOT NULL CONSTRAINT [Banner_sortOrder_df] DEFAULT 0,
    [isActive] BIT NOT NULL CONSTRAINT [Banner_isActive_df] DEFAULT 1,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Banner_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [Banner_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[Announcement] (
    [id] NVARCHAR(1000) NOT NULL,
    [text] NVARCHAR(1000) NOT NULL,
    [isActive] BIT NOT NULL CONSTRAINT [Announcement_isActive_df] DEFAULT 1,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Announcement_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [Announcement_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[Cart] (
    [id] NVARCHAR(1000) NOT NULL,
    [userId] NVARCHAR(1000) NOT NULL,
    CONSTRAINT [Cart_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Cart_userId_key] UNIQUE NONCLUSTERED ([userId])
);

-- CreateTable
CREATE TABLE [dbo].[CartItem] (
    [id] NVARCHAR(1000) NOT NULL,
    [cartId] NVARCHAR(1000) NOT NULL,
    [productId] NVARCHAR(1000) NOT NULL,
    [size] NVARCHAR(1000),
    [quantity] INT NOT NULL,
    CONSTRAINT [CartItem_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [CartItem_cartId_productId_size_key] UNIQUE NONCLUSTERED ([cartId],[productId],[size])
);

-- CreateTable
CREATE TABLE [dbo].[Wallet] (
    [id] NVARCHAR(1000) NOT NULL,
    [userId] NVARCHAR(1000) NOT NULL,
    [balance] DECIMAL(10,2) NOT NULL CONSTRAINT [Wallet_balance_df] DEFAULT 0,
    CONSTRAINT [Wallet_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Wallet_userId_key] UNIQUE NONCLUSTERED ([userId])
);

-- CreateTable
CREATE TABLE [dbo].[WalletTransaction] (
    [id] NVARCHAR(1000) NOT NULL,
    [walletId] NVARCHAR(1000) NOT NULL,
    [amount] DECIMAL(10,2) NOT NULL,
    [label] NVARCHAR(1000) NOT NULL,
    [orderId] NVARCHAR(1000),
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [WalletTransaction_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [WalletTransaction_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[LoyaltyPoints] (
    [id] NVARCHAR(1000) NOT NULL,
    [userId] NVARCHAR(1000) NOT NULL,
    [balance] INT NOT NULL CONSTRAINT [LoyaltyPoints_balance_df] DEFAULT 0,
    CONSTRAINT [LoyaltyPoints_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [LoyaltyPoints_userId_key] UNIQUE NONCLUSTERED ([userId])
);

-- CreateTable
CREATE TABLE [dbo].[LoyaltyPointsTransaction] (
    [id] NVARCHAR(1000) NOT NULL,
    [pointsId] NVARCHAR(1000) NOT NULL,
    [points] INT NOT NULL,
    [label] NVARCHAR(1000) NOT NULL,
    [orderId] NVARCHAR(1000),
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [LoyaltyPointsTransaction_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [LoyaltyPointsTransaction_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[Order] (
    [id] NVARCHAR(1000) NOT NULL,
    [userId] NVARCHAR(1000) NOT NULL,
    [addressId] NVARCHAR(1000) NOT NULL,
    [status] NVARCHAR(1000) NOT NULL CONSTRAINT [Order_status_df] DEFAULT 'PENDING',
    [subtotal] DECIMAL(10,2) NOT NULL,
    [discount] DECIMAL(10,2) NOT NULL CONSTRAINT [Order_discount_df] DEFAULT 0,
    [shippingFee] DECIMAL(10,2) NOT NULL CONSTRAINT [Order_shippingFee_df] DEFAULT 0,
    [total] DECIMAL(10,2) NOT NULL,
    [couponId] NVARCHAR(1000),
    [razorpayOrderId] NVARCHAR(1000),
    [razorpayPaymentId] NVARCHAR(1000),
    [razorpaySignature] NVARCHAR(1000),
    [paidAt] DATETIME2,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Order_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [Order_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[OrderItem] (
    [id] NVARCHAR(1000) NOT NULL,
    [orderId] NVARCHAR(1000) NOT NULL,
    [productId] NVARCHAR(1000) NOT NULL,
    [name] NVARCHAR(1000) NOT NULL,
    [size] NVARCHAR(1000),
    [price] DECIMAL(10,2) NOT NULL,
    [quantity] INT NOT NULL,
    CONSTRAINT [OrderItem_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [OtpCode_phone_idx] ON [dbo].[OtpCode]([phone]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [RefreshToken_userId_idx] ON [dbo].[RefreshToken]([userId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [PasswordResetToken_userId_idx] ON [dbo].[PasswordResetToken]([userId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Address_userId_idx] ON [dbo].[Address]([userId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [SubCategory_categoryId_idx] ON [dbo].[SubCategory]([categoryId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Product_categoryId_idx] ON [dbo].[Product]([categoryId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Product_subCategoryId_idx] ON [dbo].[Product]([subCategoryId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Product_colorGroupId_idx] ON [dbo].[Product]([colorGroupId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Product_isFlashSale_idx] ON [dbo].[Product]([isFlashSale]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [ProductContentBlock_productId_idx] ON [dbo].[ProductContentBlock]([productId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [ProductImage_productId_idx] ON [dbo].[ProductImage]([productId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Review_productId_idx] ON [dbo].[Review]([productId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Review_userId_idx] ON [dbo].[Review]([userId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [WishlistItem_userId_idx] ON [dbo].[WishlistItem]([userId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [WishlistItem_productId_idx] ON [dbo].[WishlistItem]([productId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [ProductSize_productId_idx] ON [dbo].[ProductSize]([productId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [StockMovement_productId_idx] ON [dbo].[StockMovement]([productId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [StockMovement_productSizeId_idx] ON [dbo].[StockMovement]([productSizeId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Banner_type_idx] ON [dbo].[Banner]([type]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [CartItem_cartId_idx] ON [dbo].[CartItem]([cartId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [CartItem_productId_idx] ON [dbo].[CartItem]([productId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [WalletTransaction_walletId_idx] ON [dbo].[WalletTransaction]([walletId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [LoyaltyPointsTransaction_pointsId_idx] ON [dbo].[LoyaltyPointsTransaction]([pointsId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Order_userId_idx] ON [dbo].[Order]([userId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Order_couponId_idx] ON [dbo].[Order]([couponId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Order_razorpayOrderId_idx] ON [dbo].[Order]([razorpayOrderId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [OrderItem_orderId_idx] ON [dbo].[OrderItem]([orderId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [OrderItem_productId_idx] ON [dbo].[OrderItem]([productId]);

-- AddForeignKey
ALTER TABLE [dbo].[RefreshToken] ADD CONSTRAINT [RefreshToken_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[User]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[PasswordResetToken] ADD CONSTRAINT [PasswordResetToken_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[User]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Address] ADD CONSTRAINT [Address_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[User]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[SubCategory] ADD CONSTRAINT [SubCategory_categoryId_fkey] FOREIGN KEY ([categoryId]) REFERENCES [dbo].[Category]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Product] ADD CONSTRAINT [Product_categoryId_fkey] FOREIGN KEY ([categoryId]) REFERENCES [dbo].[Category]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Product] ADD CONSTRAINT [Product_subCategoryId_fkey] FOREIGN KEY ([subCategoryId]) REFERENCES [dbo].[SubCategory]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[ProductContentBlock] ADD CONSTRAINT [ProductContentBlock_productId_fkey] FOREIGN KEY ([productId]) REFERENCES [dbo].[Product]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[ProductImage] ADD CONSTRAINT [ProductImage_productId_fkey] FOREIGN KEY ([productId]) REFERENCES [dbo].[Product]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Review] ADD CONSTRAINT [Review_productId_fkey] FOREIGN KEY ([productId]) REFERENCES [dbo].[Product]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Review] ADD CONSTRAINT [Review_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[WishlistItem] ADD CONSTRAINT [WishlistItem_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[User]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[WishlistItem] ADD CONSTRAINT [WishlistItem_productId_fkey] FOREIGN KEY ([productId]) REFERENCES [dbo].[Product]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[ProductSize] ADD CONSTRAINT [ProductSize_productId_fkey] FOREIGN KEY ([productId]) REFERENCES [dbo].[Product]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[StockMovement] ADD CONSTRAINT [StockMovement_productId_fkey] FOREIGN KEY ([productId]) REFERENCES [dbo].[Product]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[StockMovement] ADD CONSTRAINT [StockMovement_productSizeId_fkey] FOREIGN KEY ([productSizeId]) REFERENCES [dbo].[ProductSize]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Cart] ADD CONSTRAINT [Cart_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[User]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[CartItem] ADD CONSTRAINT [CartItem_cartId_fkey] FOREIGN KEY ([cartId]) REFERENCES [dbo].[Cart]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[CartItem] ADD CONSTRAINT [CartItem_productId_fkey] FOREIGN KEY ([productId]) REFERENCES [dbo].[Product]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Wallet] ADD CONSTRAINT [Wallet_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[User]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[WalletTransaction] ADD CONSTRAINT [WalletTransaction_walletId_fkey] FOREIGN KEY ([walletId]) REFERENCES [dbo].[Wallet]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[LoyaltyPoints] ADD CONSTRAINT [LoyaltyPoints_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[User]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[LoyaltyPointsTransaction] ADD CONSTRAINT [LoyaltyPointsTransaction_pointsId_fkey] FOREIGN KEY ([pointsId]) REFERENCES [dbo].[LoyaltyPoints]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Order] ADD CONSTRAINT [Order_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Order] ADD CONSTRAINT [Order_addressId_fkey] FOREIGN KEY ([addressId]) REFERENCES [dbo].[Address]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Order] ADD CONSTRAINT [Order_couponId_fkey] FOREIGN KEY ([couponId]) REFERENCES [dbo].[Coupon]([id]) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[OrderItem] ADD CONSTRAINT [OrderItem_orderId_fkey] FOREIGN KEY ([orderId]) REFERENCES [dbo].[Order]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[OrderItem] ADD CONSTRAINT [OrderItem_productId_fkey] FOREIGN KEY ([productId]) REFERENCES [dbo].[Product]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
