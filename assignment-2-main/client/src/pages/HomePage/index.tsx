import { observer } from "mobx-react"
import { useEffect, useState } from "react"
import { Button, Layout, Row, Col, Card, Spin, message, Typography, theme } from "antd"
import { useStore } from "../../hooks/useStore"
import { Link } from "react-router"
import type { PhoneListing } from "../../stores/HomeStore"
import SearchBar from "../../component/Search/SearchBar"
import { ShopOutlined, ExclamationCircleFilled } from "@ant-design/icons"

const { Content } = Layout
const { Meta } = Card
const { Title } = Typography

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000"

export const HomePage = observer(() => {
  /* ------------- store ------------- */
  const {
    homeStore: { bestSellers, soldOutSoon, setBestSellers, setSoldOutSoon },
  } = useStore()

  /* ------------- ui state ------------- */
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { token } = theme.useToken()

  /* ------------- fetch data once ------------- */
  useEffect(() => {
    const fetchHomeData = async () => {
      setLoading(true)
      setError(null)
      try {
        const [bestRes, soonRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/products/best-sellers`, { credentials: "include" }),
          fetch(`${API_BASE_URL}/api/products/sold-out-soon`, { credentials: "include" }),
        ])

        if (!bestRes.ok || !soonRes.ok) {
          throw new Error("Network response was not ok")
        }

        const [bestData, soonData] = await Promise.all([bestRes.json(), soonRes.json()])

        setBestSellers(bestData)
        setSoldOutSoon(soonData)
      } catch (err) {
        console.error(err)
        setError("Failed to load home data. Please try again later.")
        message.error("Failed to load home page")
      } finally {
        setLoading(false)
      }
    }

    fetchHomeData()
  }, [setBestSellers, setSoldOutSoon])

  /* ----------- CSS Styles ----------- */
  const cardHoverStyle = `
  .product-card:hover {
    transform: translateY(-6px);
    box-shadow: 0 12px 20px rgba(0, 0, 0, 0.15);
  }
`

  /* -------- Placeholder/Error-------- */
  if (loading) {
    return (
      <div
        style={{
          height: "calc(100vh - 200px)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Spin size="large" />
      </div>
    )
  }

  if (error) {
    return (
      <div
        style={{
          textAlign: "center",
          margin: "100px auto",
          maxWidth: 600,
          padding: 24,
          background: token.colorErrorBg,
          borderRadius: token.borderRadiusLG,
        }}
      >
        <p style={{ color: token.colorErrorText, marginBottom: 16 }}>{error}</p>
        <Button type="primary" onClick={() => window.location.reload()}>
          Retry
        </Button>
      </div>
    )
  }

  /* ----------- Render the card reuse function----------- */
  const renderCard = (phone: PhoneListing) => {
    const stock = phone.stock || Math.floor(Math.random() * 10) + 1
    const src =
      phone.image && typeof phone.image === "string"
        ? `${API_BASE_URL}/${phone.image}`
        : `${API_BASE_URL}/images/placeholder.jpeg`

    return (
      <Col key={phone._id} xs={24} sm={12} md={8} lg={4.8} xl={4.8} style={{ flex: "0 0 20%", maxWidth: "20%" }}>
        <Link to={`/phones/${phone._id}`}>
          <Card
            hoverable
            style={{
              height: "100%",
              borderRadius: "16px",
              overflow: "hidden",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)",
              transition: "all 0.3s ease",
            }}
            className="product-card"
            cover={
              <div
                style={{
                  height: 250,
                  overflow: "hidden",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: token.colorBgContainer,
                  padding: "12px",
                }}
              >
                <img
                  src={src || "/placeholder.svg"}
                  alt={phone.title}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "contain",
                    padding: 16,
                  }}
                  onError={(e) => {
                    const img = e.currentTarget as HTMLImageElement
                    if (img.src.includes("placeholder")) return
                    img.onerror = null
                    img.src = `${API_BASE_URL}/images/placeholder.jpeg`
                  }}
                />
              </div>
            }
          >
            <Meta
              title={phone.title}
              description={
                <div>
                  <div
                    style={{
                      fontSize: token.fontSizeLG,
                      color: token.colorPrimary,
                      fontWeight: "bold",
                      marginTop: "8px",
                    }}
                  >
                    ${phone.price}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginTop: "12px",
                    }}
                  >
                    <span style={{ color: token.colorTextSecondary, fontSize: "14px" }}>Only {stock} left</span>
                    <span
                      style={{
                        background: "#e6f4ff",
                        color: "#1677ff",
                        padding: "2px 10px",
                        borderRadius: "12px",
                        fontSize: "14px",
                      }}
                    >
                      Used
                    </span>
                  </div>
                </div>
              }
            />
          </Card>
        </Link>
      </Col>
    )
  }

  /* ----------- UI ----------- */
  return (
    <Layout>
      <style>{cardHoverStyle}</style>
      <Content style={{ background: token.colorBgContainer }}>
        {/* ========= Hero ========= */}
        <div
          style={{
            padding: "32px 24px",
            textAlign: "center",
            borderBottom: `1px solid ${token.colorBorderSecondary}`,
            background: `linear-gradient(to bottom, ${token.colorPrimaryBg}, ${token.colorBgContainer})`,
          }}
        >
          <div
            style={{
              maxWidth: 800,
              margin: "0 auto",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 16,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                marginBottom: 8,
              }}
            >
              <ShopOutlined style={{ fontSize: 32, color: token.colorPrimary }} />
              <Title level={2} style={{ margin: 0 }}>
                Old Phone Deals
              </Title>
            </div>

            <div style={{ width: "100%", padding: "0 24px" }}>
              <SearchBar />
            </div>
          </div>
        </div>

        {/* ========= Best Sellers ========= */}
        <section
          style={{
            maxWidth: 1200,
            margin: "12px auto",
            padding: "20px 20px 40px",
            background: token.colorBgContainer,
            borderRadius: "16px",
            boxShadow: "0 4px 20px rgba(0, 0, 0, 0.06)",
          }}
        >
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <Title
              level={2}
              style={{
                margin: 0,
                display: "inline-block",
                position: "relative",
                paddingBottom: "8px",
              }}
            >
              Best Sellers
              <span
                style={{
                  position: "absolute",
                  bottom: 0,
                  left: "50%",
                  transform: "translateX(-50%)",
                  width: "80px",
                  height: "3px",
                  background: "#1677ff",
                  borderRadius: "2px",
                }}
              ></span>
            </Title>
          </div>
          <Row gutter={[16, 35]}>{bestSellers.map(renderCard)}</Row>
        </section>

        {/* ========= Sold-out soon ========= */}
        <section
          style={{
            maxWidth: 1200,
            margin: "24px auto",
            padding: "20px 20px 40px",
            background: token.colorBgContainer,
            borderRadius: "16px",
            boxShadow: "0 4px 20px rgba(0, 0, 0, 0.06)",
          }}
        >
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <Title
              level={2}
              style={{
                margin: 0,
                display: "inline-block",
                position: "relative",
                paddingBottom: "8px",
              }}
            >
              <ExclamationCircleFilled style={{ marginRight: 8, color: token.colorWarning }} />
              Sold&nbsp;out&nbsp;soon
              <span
                style={{
                  position: "absolute",
                  bottom: 0,
                  left: "50%",
                  transform: "translateX(-50%)",
                  width: "80px",
                  height: "3px",
                  background: token.colorWarning,
                  borderRadius: "2px",
                }}
              ></span>
            </Title>
          </div>
          <Row gutter={[16, 24]}>{soldOutSoon.map(renderCard)}</Row>
        </section>
      </Content>
    </Layout>
  )
})

export default HomePage
