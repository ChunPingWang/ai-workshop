package com.telco.mwp.util;

import java.sql.Connection;

import javax.annotation.PostConstruct;
import javax.sql.DataSource;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * DB 工具, 全系統都直接 DBUtil.jdbc 拿去 query
 * (當年 production 是自己管 connection pool, 移植過來先這樣接)
 */
@Component
public class DBUtil {

    public static JdbcTemplate jdbc;
    public static DataSource ds;

    @Autowired
    private JdbcTemplate jdbcTemplate;
    @Autowired
    private DataSource dataSource;

    @PostConstruct
    public void init() {
        jdbc = jdbcTemplate;
        ds = dataSource;
    }

    // 有些舊 code 習慣自己拿 connection
    public static Connection getConn() throws Exception {
        return ds.getConnection();
    }
}
