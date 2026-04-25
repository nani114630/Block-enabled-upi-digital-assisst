from fpdf import FPDF

class Presentation(FPDF):
    def __init__(self):
        super().__init__(orientation='L', unit='mm', format='A4')
        self.set_auto_page_break(auto=True, margin=15)
        
    def add_title_slide(self, title, subtitle):
        self.add_page()
        self.set_y(70)
        self.set_font("Helvetica", "B", 36)
        self.cell(0, 20, title, align="C", new_x="LMARGIN", new_y="NEXT")
        self.set_font("Helvetica", "", 20)
        self.multi_cell(0, 10, subtitle, align="C")

    def add_bullet_slide(self, title, points):
        self.add_page()
        self.set_font("Helvetica", "B", 24)
        self.cell(0, 20, title, new_x="LMARGIN", new_y="NEXT")
        self.ln(10)
        self.set_font("Helvetica", "", 16)
        for point in points:
            self.multi_cell(0, 10, "\x95 " + point)
            self.ln(5)

pdf = Presentation()

# Slide 1: Title
pdf.add_title_slide("UPI Digital Asset System", "Blockchain-based Digital Asset Transparency Platform\nwith INR Payment Integration")

# Slide 2: Overview & Problem Statement
pdf.add_bullet_slide("Overview & Solution", [
    "Problem: Digital assets usually require crypto wallets and complex cryptocurrency transactions.",
    "Solution: A system bridging traditional payments with blockchain technology.",
    "Users can pay in INR using familiar methods (UPI, Card, Net Banking) via Razorpay.",
    "NFTs are minted on Polygon, providing immutable proof of ownership.",
    "Creates a seamless experience for non-crypto users while maintaining blockchain transparency."
])

# Slide 3: Core Features
pdf.add_bullet_slide("Core Features", [
    "User Authentication: Secure JWT-based auth with role management.",
    "Asset Marketplace: Browse, search, and filter digital assets.",
    "INR Payments: Real-time fiat payments via Razorpay.",
    "Automated NFT Minting: Automatic minting after successful payment.",
    "Dual Verification: Ownership verified via MongoDB and Polygon.",
    "Ownership History: Full transaction history stored in the smart contract."
])

# Slide 4: Tech Stack
pdf.add_bullet_slide("Tech Stack", [
    "Frontend: Next.js 14, Tailwind CSS, Zustand",
    "Backend: Node.js, Express.js, MongoDB, Mongoose",
    "Blockchain: Solidity 0.8.20, Hardhat, Ethers.js",
    "Networks & Storage: Polygon Mumbai Testnet, IPFS (Pinata)",
    "Infrastructure: MongoDB Atlas, Vercel, Render"
])

# Slide 5: Payment Flow
pdf.add_bullet_slide("End-to-End Payment Flow", [
    "1. USER selects an asset from the marketplace.",
    "2. BACKEND creates an INR order and generates a Razorpay session.",
    "3. USER completes the payment using traditional methods (e.g., Cards, UPI).",
    "4. BACKEND receives the webhook, verifying the payment status.",
    "5. SMART CONTRACT is triggered to mint the NFT on Polygon.",
    "6. USER immediately sees the NFT in their dashboard with a PolygonScan link."
])

# Slide 6: Blockchain Integration
pdf.add_bullet_slide("Blockchain Integration", [
    "Smart Contract (AssetNFT.sol) is an ERC721 token.",
    "Uses Polygon Network for low fees (~$0.001) and fast confirmations.",
    "EVM compatibility allows interaction with standard Ethereum tools.",
    "Complete transparency - Ownership is publicly verifiable on PolygonScan."
])

# Slide 7: Database Architecture
pdf.add_bullet_slide("Database Architecture", [
    "Collections Structure:",
    " - Users: Account details and authentication",
    " - Assets: Digital assets listed in the marketplace",
    " - NFTs: Records of minted non-fungible tokens",
    " - Orders: Purchase orders initiated by users",
    " - Transactions: History of payments and status",
    "Relationship: User -> Order -> NFT -> Asset"
])

# Slide 8: Thank You
pdf.add_title_slide("Thank You", "Questions & Answers")

pdf.output("UPI_Digital_Asset_System_Presentation.pdf")
print("PDF generated successfully!")
