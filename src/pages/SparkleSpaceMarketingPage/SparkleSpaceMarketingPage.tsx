import React, { useState } from "react";
import TabNavigation from "components/molecules/TabNavigation";
import { MARKETING_PAGE_TABS } from "./constants";
import "./SparkleSpaceMarketingPage.scss";
import WelcomePage from "./WelcomePage";
import FAQPage from "./FAQPage";

const SparkleSpaceMarketingPage = () => {
  const [selectedTab, setSelectedTab] = useState("welcome");
  return (
    <div className="full-page-container marketing-page">
      <TabNavigation
        selectedTab={selectedTab}
        setSelectedTab={setSelectedTab}
        tabsArray={MARKETING_PAGE_TABS}
      />

      {selectedTab === "welcome" && <WelcomePage />}
      {selectedTab === "faq" && <FAQPage />}
      {(selectedTab === "aboutUs" || selectedTab === "partyExamples") && (
        <div className="empty-container">More content is about to come</div>
      )}
    </div>
  );
};

export default SparkleSpaceMarketingPage;
