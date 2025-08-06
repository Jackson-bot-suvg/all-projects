// src/component/Search/SearchBar.tsx
"use client"

import React, { useState } from "react"
import { Input, Button } from "antd"
import { SearchOutlined } from "@ant-design/icons"
import { useNavigate } from "react-router"
import { observer } from "mobx-react-lite"
import { useStore } from "../../hooks/useStore"

const { Search } = Input

export const SearchBar: React.FC = observer(() => {
  const [searchText, setSearchText] = useState("")
  const navigate = useNavigate()
  const { searchStore } = useStore()

  const handleSearch = (value: string) => {
    console.log("🔍 handleSearch value:", value)
    if (value.trim()) {
      searchStore.setSearchQuery(value)
      searchStore.search()
      navigate("/search")
    }
  }

  return (
    <div style={{ width: "100%", maxWidth: 500, margin: "0 auto" }}>
      <Search
        placeholder="Search for phones..."
        value={searchText}
        onChange={(e) => setSearchText(e.target.value)}
        onSearch={handleSearch}
        enterButton={
          <Button type="primary" icon={<SearchOutlined />}>
            Search
          </Button>
        }
      />
    </div>
  )
})

export default SearchBar