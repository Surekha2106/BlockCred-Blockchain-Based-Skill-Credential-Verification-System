package com.blockcred.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "certificates")
public class Certificate {
    @Id
    private String id;
    
    private String studentName;
    private String courseName;
    private String institutionName;
    private String hash;
    private String filePath;
    private String txHash;

    @Column(columnDefinition = "TIMESTAMP")
    private LocalDateTime issuedAt;

    public Certificate() {}

    public Certificate(String id, String studentName, String courseName, String institutionName, String hash, String filePath, String txHash) {
        this.id = id;
        this.studentName = studentName;
        this.courseName = courseName;
        this.institutionName = institutionName;
        this.hash = hash;
        this.filePath = filePath;
        this.txHash = txHash;
    }

    @PrePersist
    protected void onCreate() {
        issuedAt = LocalDateTime.now();
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getStudentName() { return studentName; }
    public void setStudentName(String studentName) { this.studentName = studentName; }
    public String getCourseName() { return courseName; }
    public void setCourseName(String courseName) { this.courseName = courseName; }
    public String getInstitutionName() { return institutionName; }
    public void setInstitutionName(String institutionName) { this.institutionName = institutionName; }
    public String getHash() { return hash; }
    public void setHash(String hash) { this.hash = hash; }
    public String getFilePath() { return filePath; }
    public void setFilePath(String filePath) { this.filePath = filePath; }
    public String getTxHash() { return txHash; }
    public void setTxHash(String txHash) { this.txHash = txHash; }
    public LocalDateTime getIssuedAt() { return issuedAt; }
    public void setIssuedAt(LocalDateTime issuedAt) { this.issuedAt = issuedAt; }
}
