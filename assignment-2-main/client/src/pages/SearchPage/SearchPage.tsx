// src/pages/SearchPage/SearchPage.tsx
"use client"

import React, { useEffect } from "react"
import { observer } from "mobx-react-lite"
import { Layout, Row, Col, Card, Spin, Empty, Typography, Button, theme } from "antd"
import { Link } from "react-router"
import { useStore } from "../../hooks/useStore"
import SearchBar from "../../component/Search/SearchBar"
import Filter from "../../component/Search/Filter"
import { SearchOutlined } from "@ant-design/icons"

const { Content } = Layout
const { Meta } = Card
const { Title, Text } = Typography

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000"

export const SearchPage: React.FC = observer(() => {
  const { searchStore } = useStore()
  const {
    searchQuery,
    brandFilter,
    priceRange,
    priceRangeLimits,
    searchResults,
    loading,
    error,
    search,
  } = searchStore
  const { token } = theme.useToken();

  // Trigger search when query, brand, or price range changes
  useEffect(() => {
    const isDefaultPrice =
      priceRange[0] === priceRangeLimits[0] &&
      priceRange[1] === priceRangeLimits[1]

    if (searchQuery || brandFilter || !isDefaultPrice) {
      search()
    }
  }, [searchQuery, brandFilter, priceRange[0], priceRange[1]])

  if (loading) {
    return (
      <div style={{ 
        height: "calc(100vh - 200px)", 
        display: "flex", 
        justifyContent: "center", 
        alignItems: "center" 
      }}>
        <Spin size="large" />
      </div>
    )
  }

  return (
    <Layout>
      <Content style={{ background: token.colorBgContainer }}>
        {/* Search Header Section */}
        <div style={{
          padding: "32px 24px",
          textAlign: "center",
          borderBottom: `1px solid ${token.colorBorderSecondary}`,
          background: `linear-gradient(to bottom, ${token.colorPrimaryBg}, ${token.colorBgContainer})`,
        }}>
          <div style={{ 
            maxWidth: 800, 
            margin: "0 auto",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "16px"
          }}>
            <div style={{ 
              display: "flex", 
              alignItems: "center", 
              gap: "12px",
              marginBottom: "8px"
            }}>
              <SearchOutlined style={{ fontSize: 32, color: token.colorPrimary }} />
              <Title level={2} style={{ margin: 0 }}>
                Search Products
              </Title>
            </div>
            
            <div style={{ width: "100%", padding: "0 24px" }}>
              <SearchBar />
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div style={{ 
          maxWidth: 1200, 
          margin: "0 auto",
          padding: "40px 24px"
        }}>
          <Row gutter={[24, 24]}>
            {/* Filter Column */}
            <Col xs={24} sm={24} md={6} lg={6}>
              <div style={{
                background: token.colorBgContainer,
                padding: 24,
                borderRadius: token.borderRadiusLG,
                border: `1px solid ${token.colorBorderSecondary}`
              }}>
                <Title level={4} style={{ marginBottom: 24 }}>Filters</Title>
                <Filter />
              </div>
            </Col>

            {/* Results Column */}
            <Col xs={24} sm={24} md={18} lg={18}>
              <Title level={4} style={{ marginBottom: 24 }}>
                {searchQuery
                  ? `Search results for "${searchQuery}"`
                  : "All Products"}
                {brandFilter && ` - Brand: ${brandFilter}`}
              </Title>

              {error && (
                <div style={{ 
                  marginBottom: 24,
                  padding: 16,
                  background: token.colorErrorBg,
                  borderRadius: token.borderRadiusLG
                }}>
                  <Text type="danger">{error}</Text>
                  <Button type="link" onClick={() => search()}>
                    Try again
                  </Button>
                </div>
              )}

              {searchResults.length === 0 ? (
                <Empty description={
                  searchQuery || brandFilter
                    ? "No products found matching your criteria"
                    : "Enter a search term to find products"
                } />
              ) : (
                <Row gutter={[24, 24]}>
                  {searchResults.map((phone) => {
                    const src = phone.image
                      ? `${API_BASE_URL}/${phone.image}`
                      : `${API_BASE_URL}/images/placeholder.jpeg`;

                    return (
                      <Col key={phone._id} xs={24} sm={12} md={8} lg={8}>
                        <Link to={`/phones/${phone._id}`}>
                          <Card
                            hoverable
                            style={{ 
                              height: "100%",
                              minHeight: "350px" // 添加最小高度防止抖动
                            }}
                            cover={
                              <div style={{
                                height: 250,
                                overflow: "hidden",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                background: token.colorFillQuaternary,
                                position: "relative" // 添加相对定位
                              }}>
                                <img
                                  src={src}
                                  alt={phone.title}
                                  style={{ 
                                    position: "absolute", // 使用绝对定位
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "contain",
                                    padding: "16px"
                                  }}
                                  onError={(e) => {
                                    const img = e.currentTarget as HTMLImageElement;
                                    if (img.src.includes("placeholder")) return;
                                    img.onerror = null;
                                    img.src = `${API_BASE_URL}/images/placeholder.jpeg`;
                                  }}
                                />
                              </div>
                            }
                          >
                            <Meta 
                              title={
                                <div style={{ 
                                  whiteSpace: "nowrap",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis"
                                }}>
                                  {phone.title}
                                </div>
                              }
                              description={
                                <div style={{ 
                                  fontSize: token.fontSizeLG,
                                  color: token.colorPrimary,
                                  fontWeight: "bold"
                                }}>
                                  ${phone.price}
                                </div>
                              }
                            />
                          </Card>
                        </Link>
                      </Col>
                    )
                  })}
                </Row>
              )}
            </Col>
          </Row>
        </div>
      </Content>
    </Layout>
  )
})

export default SearchPage